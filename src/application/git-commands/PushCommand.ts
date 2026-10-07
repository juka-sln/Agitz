import { attachedHead } from '@/domain/entities/Head';
import { storeHostedRepository, type Network } from '@/domain/entities/Network';
import { remoteTrackingName, upstreamName } from '@/domain/entities/Remote';
import {
  branchNames,
  currentBranch,
  deleteBranch,
  deleteRemoteBranch,
  deleteTag,
  findBranch,
  findRemoteBranch,
  findTag,
  findUpstream,
  remoteNames,
  setBranch,
  setRemoteBranch,
  setTag,
  setUpstream,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  NoPushDestinationError,
  NoUpstreamBranchError,
  PushFromDetachedHeadError,
  SourceRefspecError,
} from '@/domain/errors/RemoteErrors';
import { isAncestor } from '@/domain/services/history';
import { tryResolveRevision } from '@/domain/services/revision';
import { parseBranchName, type BranchName } from '@/domain/value-objects/BranchName';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { explain, type CommandOutcome, type Explanation, type GitCommand } from './GitCommand';
import {
  formatRefUpdates,
  requireHostedRepository,
  requireRemote,
  transferObjects,
  type NamedRemote,
  type RefUpdateLine,
} from './support/remotes';

export interface PushInput {
  readonly network: Network;
  readonly remote?: string | undefined;
  /** `<src>[:<dst>]`, `+<src>:<dst>` to force, `:<dst>` to delete. */
  readonly refspecs?: readonly string[];
  /** `-u`: make each pushed branch track the remote branch it was pushed to. */
  readonly setUpstream?: boolean;
  readonly force?: boolean;
  /** Force only if the remote branch is still where our remote-tracking branch says it is. */
  readonly forceWithLease?: boolean;
  /** `--tags`: push every tag as well. */
  readonly tags?: boolean;
  /** `--delete`: delete the named remote refs. */
  readonly delete?: boolean;
}

type RefKind = 'branch' | 'tag';

interface RefPush {
  readonly kind: RefKind;
  /** Name as typed, shown on the left of the arrow. */
  readonly label: string;
  /** Commit to send, or `null` to delete the remote ref. */
  readonly source: Hash | null;
  readonly destination: string;
  readonly force: boolean;
  /** The local branch to set up as tracking `destination` with `-u`. */
  readonly localBranch: BranchName | null;
}

type Rejection = 'fetch first' | 'non-fast-forward' | 'stale info' | 'already exists';

interface PushState {
  hosted: Repository;
  local: Repository;
  readonly lines: RefUpdateLine[];
  readonly errors: string[];
  readonly rejections: { readonly reason: Rejection; readonly push: RefPush }[];
  readonly upstreamsSet: string[];
}

const HINTS: Record<Rejection, readonly string[]> = {
  'fetch first': [
    'Updates were rejected because the remote contains work that you do not',
    'have locally. This is usually caused by another repository pushing to',
    'the same ref. If you want to integrate the remote changes, use',
    "'git pull' before pushing again.",
    "See the 'Note about fast-forwards' in 'git push --help' for details.",
  ],
  'non-fast-forward': [
    'Updates were rejected because the tip of your current branch is behind',
    'its remote counterpart. If you want to integrate the remote changes,',
    "use 'git pull' before pushing again.",
    "See the 'Note about fast-forwards' in 'git push --help' for details.",
  ],
  'already exists': ['Updates were rejected because the tag already exists in the remote.'],
  'stale info': [],
};

const REJECTION_EXPLANATIONS: Record<Rejection, string> = {
  'fetch first': 'push.rejectedFetchFirst',
  'non-fast-forward': 'push.rejectedNonFastForward',
  'stale info': 'push.rejectedStale',
  'already exists': 'push.rejectedTag',
};

/**
 * Sends local commits to a hosted repository and moves its branches, but only forward:
 * a push that would drop commits on the remote is rejected unless it is forced.
 */
export class PushCommand implements GitCommand<PushInput> {
  execute(workspace: Workspace, input: PushInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const remote = requireRemote(repository, this.remoteName(repository, input));
    const hosted = requireHostedRepository(input.network, remote.url);
    const pushes = this.planPushes(repository, remote, input);

    const state: PushState = {
      hosted,
      local: repository,
      lines: [],
      errors: [],
      rejections: [],
      upstreamsSet: [],
    };
    for (const push of pushes) {
      this.pushRef(state, remote, push, input);
    }

    const failed = state.errors.length > 0 || state.rejections.length > 0;
    const output = [
      ...(state.lines.length > 0
        ? [`To ${remote.url}`, ...formatRefUpdates(state.lines, 'push')]
        : []),
      ...state.errors,
      ...(failed ? [`error: failed to push some refs to '${remote.url}'`] : []),
      ...this.hints(state),
      ...(!failed && state.lines.length === 0 ? ['Everything up-to-date'] : []),
      ...state.upstreamsSet.map(
        (branch) => `branch '${branch}' set up to track '${this.trackingOf(state.local, branch)}'.`,
      ),
    ];

    return {
      workspace: { ...workspace, repository: state.local },
      output: output.join('\n'),
      exitCode: failed ? 1 : 0,
      explanation: this.explainPush(state, remote),
      network: storeHostedRepository(input.network, remote.url, state.hosted),
    };
  }

  private remoteName(repository: Repository, input: PushInput): string {
    if (input.remote !== undefined) {
      return input.remote;
    }
    if (remoteNames(repository).length === 0) {
      throw new NoPushDestinationError();
    }
    const branch = currentBranch(repository);
    return (branch === null ? undefined : findUpstream(repository, branch)?.remote) ?? 'origin';
  }

  private planPushes(repository: Repository, remote: NamedRemote, input: PushInput): RefPush[] {
    const refspecs = input.refspecs ?? [];
    const tagPushes =
      input.tags === true
        ? Object.entries(repository.tags).map(([name, tag]) => ({
            kind: 'tag' as const,
            label: name,
            source: tag.target,
            destination: name,
            force: input.force === true,
            localBranch: null,
          }))
        : [];

    if (input.delete === true) {
      return refspecs.map((name) => this.deletion(repository, name));
    }
    if (refspecs.length > 0) {
      return [
        ...refspecs.map((refspec) => this.parseRefspec(repository, remote, refspec, input)),
        ...tagPushes,
      ];
    }
    if (input.tags === true) {
      return tagPushes;
    }
    return [this.currentBranchPush(repository, remote, input)];
  }

  /** `git push` alone: the current branch, to the branch it tracks on that remote. */
  private currentBranchPush(
    repository: Repository,
    remote: NamedRemote,
    input: PushInput,
  ): RefPush {
    const branch = currentBranch(repository);
    if (branch === null) {
      throw new PushFromDetachedHeadError(remote.name);
    }
    const upstream = findUpstream(repository, branch);
    const tracksThisRemote = upstream?.remote === remote.name;
    if (!tracksThisRemote && remote.name === 'origin') {
      throw new NoUpstreamBranchError(branch, remote.name);
    }
    return this.branchPush(
      repository,
      remote,
      branch,
      tracksThisRemote ? upstream.branch : branch,
      input.force === true,
    );
  }

  private branchPush(
    repository: Repository,
    remote: NamedRemote,
    branch: BranchName,
    destination: string,
    force: boolean,
    label: string = branch,
  ): RefPush {
    const source = findBranch(repository, branch);
    if (source === undefined) {
      throw new SourceRefspecError(label, remote.url);
    }
    return { kind: 'branch', label, source, destination, force, localBranch: branch };
  }

  private deletion(repository: Repository, name: string): RefPush {
    const kind: RefKind =
      findTag(repository, name) !== undefined && findBranch(repository, name) === undefined
        ? 'tag'
        : 'branch';
    return { kind, label: name, source: null, destination: name, force: true, localBranch: null };
  }

  private parseRefspec(
    repository: Repository,
    remote: NamedRemote,
    raw: string,
    input: PushInput,
  ): RefPush {
    const force = raw.startsWith('+') || input.force === true;
    const refspec = raw.replace(/^\+/, '');
    const separator = refspec.indexOf(':');
    const source = separator === -1 ? refspec : refspec.slice(0, separator);
    const destination = separator === -1 ? undefined : refspec.slice(separator + 1);

    if (source === '' && destination !== undefined) {
      return this.deletion(repository, destination);
    }
    if (source === 'HEAD' || source === '@') {
      const branch = currentBranch(repository);
      if (branch === null && destination === undefined) {
        throw new PushFromDetachedHeadError(remote.name);
      }
      if (branch !== null) {
        return this.branchPush(repository, remote, branch, destination ?? branch, force, source);
      }
    }
    if (findBranch(repository, source) !== undefined) {
      return this.branchPush(
        repository,
        remote,
        source as BranchName,
        destination ?? source,
        force,
      );
    }
    const tag = findTag(repository, source);
    if (tag !== undefined) {
      return {
        kind: 'tag',
        label: source,
        source: tag.target,
        destination: destination ?? source,
        force,
        localBranch: null,
      };
    }
    const commit = destination === undefined ? null : tryResolveRevision(repository, source);
    if (commit === null || destination === undefined) {
      throw new SourceRefspecError(source, remote.url);
    }
    return {
      kind: 'branch',
      label: source,
      source: commit,
      destination: parseBranchName(destination),
      force,
      localBranch: null,
    };
  }

  private pushRef(state: PushState, remote: NamedRemote, push: RefPush, input: PushInput): void {
    const remoteTip =
      push.kind === 'branch'
        ? findBranch(state.hosted, push.destination)
        : findTag(state.hosted, push.destination)?.target;
    const trackingName = remoteTrackingName(remote.name, push.destination);
    const line = { from: push.label, to: push.destination };

    if (push.source === null) {
      if (remoteTip === undefined) {
        state.errors.push(
          `error: unable to delete '${push.destination}': remote ref does not exist`,
        );
        return;
      }
      state.hosted =
        push.kind === 'branch'
          ? deleteBranch(state.hosted, push.destination as BranchName)
          : deleteTag(state.hosted, push.destination);
      state.local = deleteRemoteBranch(state.local, trackingName);
      state.lines.push({ flag: '-', summary: '[deleted]', from: push.destination, to: null });
      return;
    }

    const rejection = this.checkUpdate(
      state.local,
      remoteTip,
      push.source,
      push,
      trackingName,
      input,
    );
    if (rejection !== null) {
      state.rejections.push({ reason: rejection, push });
      state.lines.push({ flag: '!', summary: '[rejected]', ...line, reason: rejection });
      return;
    }

    if (remoteTip !== push.source) {
      this.updateRemoteRef(state, push, push.source);
      if (remoteTip === undefined) {
        state.lines.push({
          flag: '*',
          summary: push.kind === 'branch' ? '[new branch]' : '[new tag]',
          ...line,
        });
      } else if (isAncestor(state.local, remoteTip, push.source)) {
        state.lines.push({
          flag: ' ',
          summary: `${shortHash(remoteTip)}..${shortHash(push.source)}`,
          ...line,
        });
      } else {
        state.lines.push({
          flag: '+',
          summary: `${shortHash(remoteTip)}...${shortHash(push.source)}`,
          ...line,
          reason: 'forced update',
        });
      }
    }
    if (push.kind === 'branch') {
      state.local = setRemoteBranch(state.local, trackingName, push.source);
      if (input.setUpstream === true && push.localBranch !== null) {
        state.local = setUpstream(state.local, push.localBranch, {
          remote: remote.name,
          branch: parseBranchName(push.destination),
        });
        state.upstreamsSet.push(push.localBranch);
      }
    }
  }

  /** Why the remote would refuse to move its ref to `push.source`, if it would. */
  private checkUpdate(
    local: Repository,
    remoteTip: Hash | undefined,
    source: Hash,
    push: RefPush,
    trackingName: string,
    input: PushInput,
  ): Rejection | null {
    if (remoteTip === undefined || remoteTip === source) {
      return null;
    }
    if (push.kind === 'tag') {
      return push.force ? null : 'already exists';
    }
    if (input.forceWithLease === true && !push.force) {
      return findRemoteBranch(local, trackingName) === remoteTip ? null : 'stale info';
    }
    if (push.force) {
      return null;
    }
    if (local.commits[remoteTip] === undefined) {
      return 'fetch first';
    }
    return isAncestor(local, remoteTip, source) ? null : 'non-fast-forward';
  }

  private updateRemoteRef(state: PushState, push: RefPush, source: Hash): void {
    const isFirstBranch = push.kind === 'branch' && branchNames(state.hosted).length === 0;
    let hosted = transferObjects(state.local, state.hosted, [source]);
    if (push.kind === 'tag') {
      const tag = findTag(state.local, push.label);
      hosted = setTag(hosted, push.destination, tag ?? { target: source, annotation: null });
    } else {
      const branch = parseBranchName(push.destination);
      hosted = setBranch(hosted, branch, source);
      // The first branch pushed to an empty repository becomes its default branch.
      if (isFirstBranch) {
        hosted = { ...hosted, head: attachedHead(branch) };
      }
    }
    state.hosted = hosted;
  }

  private trackingOf(repository: Repository, branch: string): string {
    const upstream = findUpstream(repository, branch);
    return upstream === undefined ? '' : upstreamName(upstream);
  }

  private hints(state: PushState): string[] {
    const reason = (['fetch first', 'non-fast-forward', 'already exists'] as const).find(
      (candidate) => state.rejections.some((rejection) => rejection.reason === candidate),
    );
    return reason === undefined ? [] : HINTS[reason].map((line) => `hint: ${line}`);
  }

  private explainPush(state: PushState, remote: NamedRemote): Explanation {
    const first = state.rejections[0];
    if (first !== undefined) {
      return explain(REJECTION_EXPLANATIONS[first.reason], {
        remote: remote.name,
        branch: first.push.destination,
      });
    }
    if (state.errors.length > 0) {
      return explain('push.deleteMissing', { remote: remote.name });
    }
    const line = state.lines[0];
    const upstream = state.upstreamsSet[0];
    const params = {
      remote: remote.name,
      branch: line?.to ?? line?.from ?? '',
      upstream: upstream === undefined ? '' : this.trackingOf(state.local, upstream),
      count: state.lines.length,
    };
    switch (line?.flag) {
      case undefined:
        return explain(upstream === undefined ? 'push.upToDate' : 'push.upstreamSet', params);
      case '-':
        return explain('push.deleted', { ...params, branch: line.from });
      case '+':
        return explain('push.forced', params);
      case '*':
        return explain(line.summary === '[new tag]' ? 'push.tags' : 'push.created', params);
      default:
        return explain('push.updated', params);
    }
  }
}
