import { displayRepositoryUrl, type Network } from '@/domain/entities/Network';
import { remoteTrackingName } from '@/domain/entities/Remote';
import {
  currentBranch,
  findRemoteBranch,
  findUpstream,
  getCommit,
  getHeadCommitHash,
  remoteNames,
  setBranch,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { GitError } from '@/domain/errors/GitError';
import {
  NoTrackingInformationError,
  PullBranchNotSpecifiedError,
  PullFromDetachedHeadError,
  RemoteRefNotFoundError,
  UpstreamRefNotFetchedError,
} from '@/domain/errors/RemoteErrors';
import { checkoutTree } from '@/domain/services/checkoutTree';
import { isAncestor } from '@/domain/services/history';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { MergeCommand } from './MergeCommand';
import { RebaseCommand } from './RebaseCommand';
import { fetchRemote, type FetchResult } from './support/fetchRemote';

export interface PullInput {
  readonly network: Network;
  readonly remote?: string | undefined;
  readonly branch?: string | undefined;
  /** `--rebase` replays local commits on top of the remote ones, `--no-rebase` merges. */
  readonly mode?: 'merge' | 'rebase' | undefined;
  readonly fastForwardOnly?: boolean;
}

const DIVERGENT_BRANCHES_ADVICE = [
  'hint: You have divergent branches and need to specify how to reconcile them.',
  'hint: You can do so by running one of the following commands sometime before',
  'hint: your next pull:',
  'hint:',
  'hint:   git config pull.rebase false  # merge',
  'hint:   git config pull.rebase true   # rebase',
  'hint:   git config pull.ff only       # fast-forward only',
  'hint:',
  'hint: You can replace "git config" with "git config --global" to set a default',
  'hint: preference for all repositories. You can also pass --rebase, --no-rebase,',
  'hint: or --ff-only on the command line to override the configured default per',
  'hint: invocation.',
  'fatal: Need to specify how to reconcile divergent branches.',
];

/** How each outcome of the integration step reads once it is part of a pull. */
const PULL_EXPLANATIONS: Readonly<Record<string, string>> = {
  'merge.fastForward': 'pull.fastForward',
  'merge.merged': 'pull.merged',
  'merge.conflicts': 'pull.mergeConflicts',
  'rebase.done': 'pull.rebased',
  'rebase.conflicts': 'pull.rebaseConflicts',
};

interface PullSource {
  readonly remote: string;
  readonly branch: string;
  /** Explicit `git pull <remote> <branch>` only fetches that branch. */
  readonly explicit: boolean;
}

/** `git fetch` followed by `git merge` (or `git rebase`) of the remote branch into the current one. */
export class PullCommand implements GitCommand<PullInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: PullInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const source = this.source(repository, input);
    const fetched = this.fetch(repository, input.network, source);
    const fetchedWorkspace = { ...workspace, repository: fetched.repository };
    const target = remoteTrackingName(source.remote, source.branch);
    const theirs = findRemoteBranch(fetched.repository, target);
    if (theirs === undefined) {
      throw new RemoteRefNotFoundError(source.branch);
    }

    const prepend = (outcome: CommandOutcome): CommandOutcome => ({
      ...outcome,
      output: [...fetched.lines, outcome.output].filter((part) => part !== '').join('\n'),
    });
    try {
      return prepend(this.integrate(fetchedWorkspace, fetched, source, target, theirs, input));
    } catch (error) {
      // The fetch went through even if integrating failed, as with a real `git pull`.
      if (!(error instanceof GitError)) {
        throw error;
      }
      return prepend({
        workspace: fetchedWorkspace,
        output: error.message,
        exitCode: error.exitCode,
        explanation: explain(`error.${error.code}`, error.params),
      });
    }
  }

  private source(repository: Repository, input: PullInput): PullSource {
    const branch = currentBranch(repository);
    const upstream = branch === null ? undefined : findUpstream(repository, branch);
    if (input.remote !== undefined) {
      const remoteBranch =
        input.branch ?? (upstream?.remote === input.remote ? upstream.branch : undefined);
      if (remoteBranch === undefined) {
        throw new PullBranchNotSpecifiedError(input.remote);
      }
      return { remote: input.remote, branch: remoteBranch, explicit: input.branch !== undefined };
    }
    if (branch === null) {
      throw new PullFromDetachedHeadError();
    }
    if (upstream === undefined) {
      const remotes = remoteNames(repository);
      throw new NoTrackingInformationError(
        branch,
        remotes.length === 1 ? (remotes[0] ?? null) : null,
      );
    }
    return { remote: upstream.remote, branch: upstream.branch, explicit: false };
  }

  private fetch(repository: Repository, network: Network, source: PullSource): FetchResult {
    const fetched = fetchRemote(repository, network, source.remote, {
      branches: source.explicit ? [source.branch] : undefined,
    });
    if (!fetched.remoteBranches.includes(source.branch)) {
      throw new UpstreamRefNotFetchedError(source.branch);
    }
    return fetched;
  }

  private integrate(
    workspace: Workspace,
    fetched: FetchResult,
    source: PullSource,
    target: string,
    theirs: Hash,
    input: PullInput,
  ): CommandOutcome {
    const repository = fetched.repository;
    const head = getHeadCommitHash(repository);
    const params = { remote: source.remote, branch: source.branch, target };

    if (head === null) {
      return this.startBranch(workspace, repository, theirs, params);
    }
    if (isAncestor(repository, theirs, head)) {
      return succeed(workspace, 'Already up to date.', explain('pull.upToDate', params));
    }
    const canFastForward = isAncestor(repository, head, theirs);
    if (!canFastForward && input.mode === undefined && input.fastForwardOnly !== true) {
      return {
        workspace,
        output: DIVERGENT_BRANCHES_ADVICE.join('\n'),
        exitCode: 128,
        explanation: explain('pull.divergent', params),
      };
    }

    const outcome =
      input.mode === 'rebase' && !canFastForward
        ? new RebaseCommand(this.context).execute(workspace, { action: 'start', upstream: target })
        : new MergeCommand(this.context).execute(workspace, {
            action: 'merge',
            target,
            message: `Merge branch '${source.branch}' of ${displayRepositoryUrl(fetched.url)}`,
            fastForwardOnly: input.fastForwardOnly === true,
          });
    const key = PULL_EXPLANATIONS[outcome.explanation.key];
    return key === undefined
      ? outcome
      : { ...outcome, explanation: explain(key, { ...outcome.explanation.params, ...params }) };
  }

  /** Pulling into a branch without commits simply makes it start where the remote branch is. */
  private startBranch(
    workspace: Workspace,
    repository: Repository,
    theirs: Hash,
    params: Readonly<Record<string, string>>,
  ): CommandOutcome {
    const branch = currentBranch(repository);
    if (branch === null) {
      throw new PullFromDetachedHeadError();
    }
    const { index, files } = checkoutTree(
      repository,
      workspace.files,
      getCommit(repository, theirs).tree,
      'merge',
    );
    return succeed(
      { ...workspace, files, repository: { ...setBranch(repository, branch, theirs), index } },
      '',
      explain('pull.started', { ...params, commit: shortHash(theirs) }),
    );
  }
}
