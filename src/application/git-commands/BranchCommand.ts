import { attachedHead } from '@/domain/entities/Head';
import { upstreamName } from '@/domain/entities/Remote';
import {
  branchNames,
  currentBranch,
  deleteBranch,
  findBranch,
  findUpstream,
  getCommit,
  getHeadCommitHash,
  setBranch,
  setUpstream,
  unsetUpstream,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  BranchAlreadyExistsError,
  BranchNotFoundError,
  BranchNotFullyMergedError,
  CannotDeleteCurrentBranchError,
  CannotForceUpdateCurrentBranchError,
  DetachedHeadRenameError,
  NoBranchNamedError,
} from '@/domain/errors/BranchErrors';
import { GitError } from '@/domain/errors/GitError';
import {
  DetachedHeadUpstreamError,
  LocalUpstreamNotSupportedError,
  NoUpstreamConfiguredError,
  UpstreamBranchNotFoundError,
} from '@/domain/errors/RemoteErrors';
import { InvalidObjectNameError } from '@/domain/errors/RepositoryErrors';
import { isAncestor } from '@/domain/services/history';
import { tryResolveRevision } from '@/domain/services/revision';
import { parseBranchName, type BranchName } from '@/domain/value-objects/BranchName';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import {
  formatTrackingSummary,
  formatUpstreamSetup,
  upstreamForStartPoint,
} from './support/remotes';

export type BranchListScope = 'local' | 'remote' | 'all';

export type BranchInput =
  | {
      readonly action: 'list';
      /** `-v` shows the last commit, `-vv` also names the upstream branch. */
      readonly verbosity?: number;
      readonly scope?: BranchListScope;
    }
  | {
      readonly action: 'create';
      readonly name: string;
      readonly startPoint?: string | undefined;
      readonly force?: boolean;
    }
  | { readonly action: 'delete'; readonly names: readonly string[]; readonly force?: boolean }
  | {
      readonly action: 'rename';
      readonly oldName?: string | undefined;
      readonly newName: string;
      readonly force?: boolean;
    }
  | {
      readonly action: 'setUpstream';
      readonly upstream: string;
      readonly branch?: string | undefined;
    }
  | { readonly action: 'unsetUpstream'; readonly branch?: string | undefined };

export class BranchCommand implements GitCommand<BranchInput> {
  execute(workspace: Workspace, input: BranchInput): CommandOutcome {
    const repository = requireRepository(workspace);
    switch (input.action) {
      case 'list':
        return this.list(workspace, repository, input.verbosity ?? 0, input.scope ?? 'local');
      case 'create':
        return this.create(
          workspace,
          repository,
          input.name,
          input.startPoint,
          input.force === true,
        );
      case 'delete':
        return this.delete(workspace, repository, input.names, input.force === true);
      case 'rename':
        return this.rename(
          workspace,
          repository,
          input.oldName,
          input.newName,
          input.force === true,
        );
      case 'setUpstream':
        return this.setUpstream(workspace, repository, input.upstream, input.branch);
      case 'unsetUpstream':
        return this.unsetUpstream(workspace, repository, input.branch);
    }
  }

  private list(
    workspace: Workspace,
    repository: Repository,
    verbosity: number,
    scope: BranchListScope,
  ): CommandOutcome {
    const { head } = repository;
    const rows: { marker: string; label: string; hash: Hash; branch: string | null }[] = [];
    if (scope !== 'remote') {
      for (const name of branchNames(repository)) {
        const hash = findBranch(repository, name);
        if (hash !== undefined) {
          rows.push({
            marker: currentBranch(repository) === name ? '*' : ' ',
            label: name,
            hash,
            branch: name,
          });
        }
      }
      if (head.type === 'detached') {
        rows.unshift({
          marker: '*',
          label: `(HEAD detached at ${shortHash(head.commit)})`,
          hash: head.commit,
          branch: null,
        });
      }
    }
    if (scope !== 'local') {
      for (const [name, hash] of Object.entries(repository.remoteBranches).sort(([left], [right]) =>
        left.localeCompare(right),
      )) {
        rows.push({
          marker: ' ',
          label: scope === 'all' ? `remotes/${name}` : name,
          hash,
          branch: null,
        });
      }
    }

    const width = Math.max(0, ...rows.map((row) => row.label.length));
    const output = rows
      .map(({ marker, label, hash, branch }) => {
        if (verbosity === 0) {
          return `${marker} ${label}`;
        }
        const commit = getCommit(repository, hash);
        const tracking =
          branch === null ? null : formatTrackingSummary(repository, branch, verbosity > 1);
        return `${marker} ${label.padEnd(width)} ${shortHash(hash)} ${tracking === null ? '' : `${tracking} `}${commitSubject(commit.message)}`;
      })
      .join('\n');

    return succeed(
      workspace,
      output,
      explain(scope === 'local' ? 'branch.listed' : 'branch.listedRemote', { count: rows.length }),
    );
  }

  private create(
    workspace: Workspace,
    repository: Repository,
    rawName: string,
    startPoint: string | undefined,
    force: boolean,
  ): CommandOutcome {
    const name = parseBranchName(rawName);
    const existing = findBranch(repository, name);

    if (existing !== undefined && !force) {
      throw new BranchAlreadyExistsError(name);
    }
    if (existing !== undefined && currentBranch(repository) === name) {
      throw new CannotForceUpdateCurrentBranchError(name);
    }

    const target = tryResolveRevision(repository, startPoint ?? 'HEAD');
    if (target === null) {
      throw new InvalidObjectNameError(startPoint ?? currentBranch(repository) ?? 'HEAD');
    }

    const upstream =
      startPoint === undefined ? null : upstreamForStartPoint(repository, startPoint);
    const next = setBranch(repository, name, target);
    if (upstream !== null) {
      return succeed(
        { ...workspace, repository: setUpstream(next, name, upstream) },
        formatUpstreamSetup(name, upstream),
        explain('branch.createdTracking', {
          name,
          commit: shortHash(target),
          upstream: upstreamName(upstream),
        }),
      );
    }
    return succeed(
      { ...workspace, repository: next },
      '',
      explain(existing === undefined ? 'branch.created' : 'branch.reset', {
        name,
        commit: shortHash(target),
      }),
    );
  }

  /** Deletes each branch independently: one failure does not prevent the others. */
  private delete(
    workspace: Workspace,
    repository: Repository,
    names: readonly string[],
    force: boolean,
  ): CommandOutcome {
    let next = repository;
    const lines: string[] = [];
    const deleted: string[] = [];
    let firstError: GitError | null = null;

    for (const name of names) {
      try {
        const hash = findBranch(next, name);
        if (hash === undefined) {
          throw new BranchNotFoundError(name);
        }
        if (currentBranch(next) === name) {
          throw new CannotDeleteCurrentBranchError(name, workspace.path);
        }
        const head = getHeadCommitHash(next);
        if (!force && (head === null || !isAncestor(next, hash, head))) {
          throw new BranchNotFullyMergedError(name);
        }
        next = unsetUpstream(deleteBranch(next, name as BranchName), name);
        deleted.push(name);
        lines.push(`Deleted branch ${name} (was ${shortHash(hash)}).`);
      } catch (error) {
        if (!(error instanceof GitError)) {
          throw error;
        }
        firstError ??= error;
        lines.push(error.message);
      }
    }

    return {
      workspace: { ...workspace, repository: next },
      output: lines.join('\n'),
      exitCode: firstError === null ? 0 : 1,
      explanation:
        firstError === null
          ? explain('branch.deleted', { names: deleted.join(', '), count: deleted.length })
          : explain(`error.${firstError.code}`, firstError.params),
    };
  }

  private rename(
    workspace: Workspace,
    repository: Repository,
    oldName: string | undefined,
    rawNewName: string,
    force: boolean,
  ): CommandOutcome {
    const current = currentBranch(repository);
    const source = oldName ?? current;
    if (source === null) {
      throw new DetachedHeadRenameError();
    }
    const newName = parseBranchName(rawNewName);
    const hash = findBranch(repository, source);
    const isUnbornCurrent = hash === undefined && source === current;

    if (hash === undefined && !isUnbornCurrent) {
      throw new NoBranchNamedError(source);
    }
    if (newName !== source && findBranch(repository, newName) !== undefined && !force) {
      throw new BranchAlreadyExistsError(newName);
    }

    const upstream = findUpstream(repository, source);
    let next = unsetUpstream(deleteBranch(repository, source as BranchName), source);
    if (hash !== undefined) {
      next = setBranch(next, newName, hash);
    }
    if (upstream !== undefined) {
      next = setUpstream(next, newName, upstream);
    }
    if (source === current) {
      next = { ...next, head: attachedHead(newName) };
    }

    return succeed(
      { ...workspace, repository: next },
      '',
      explain('branch.renamed', { from: source, to: newName }),
    );
  }

  private setUpstream(
    workspace: Workspace,
    repository: Repository,
    rawUpstream: string,
    rawBranch: string | undefined,
  ): CommandOutcome {
    const branch = rawBranch ?? currentBranch(repository);
    if (branch === null) {
      throw new DetachedHeadUpstreamError(rawUpstream);
    }
    if (findBranch(repository, branch) === undefined) {
      throw new BranchNotFoundError(branch);
    }
    const upstream = upstreamForStartPoint(repository, rawUpstream);
    if (upstream === null) {
      if (findBranch(repository, rawUpstream) !== undefined) {
        throw new LocalUpstreamNotSupportedError(rawUpstream);
      }
      throw new UpstreamBranchNotFoundError(rawUpstream);
    }
    return succeed(
      { ...workspace, repository: setUpstream(repository, branch as BranchName, upstream) },
      formatUpstreamSetup(branch, upstream),
      explain('branch.upstreamSet', { name: branch, upstream: upstreamName(upstream) }),
    );
  }

  private unsetUpstream(
    workspace: Workspace,
    repository: Repository,
    rawBranch: string | undefined,
  ): CommandOutcome {
    const branch = rawBranch ?? currentBranch(repository);
    if (branch === null) {
      throw new DetachedHeadRenameError();
    }
    if (findUpstream(repository, branch) === undefined) {
      throw new NoUpstreamConfiguredError(branch);
    }
    return succeed(
      { ...workspace, repository: unsetUpstream(repository, branch) },
      '',
      explain('branch.upstreamUnset', { name: branch }),
    );
  }
}
