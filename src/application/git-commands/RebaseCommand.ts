import { detachedHead } from '@/domain/entities/Head';
import {
  currentBranch,
  getCommit,
  getHeadCommitHash,
  hasUnmergedPaths,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  DirtyWorkingTreeError,
  InvalidUpstreamError,
  OperationInProgressError,
  UnmergedFilesError,
} from '@/domain/errors/OperationErrors';
import { NoCommitsYetError } from '@/domain/errors/RepositoryErrors';
import { checkoutTree } from '@/domain/services/checkoutTree';
import {
  collectReachableCommits,
  isAncestor,
  listCommitsInLogOrder,
} from '@/domain/services/history';
import { tryResolveRevision } from '@/domain/services/revision';
import { computeStatus } from '@/domain/services/status';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { abortSequence, continueSequence, runSequence, skipSequence } from './support/sequencer';

export type RebaseInput =
  | { readonly action: 'start'; readonly upstream: string }
  | { readonly action: 'continue' | 'skip' | 'abort' };

/**
 * Replays the commits of the current branch on top of another one, producing new
 * commits with the same changes: the history becomes linear, the old commits are left behind.
 */
export class RebaseCommand implements GitCommand<RebaseInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: RebaseInput): CommandOutcome {
    switch (input.action) {
      case 'continue':
        return continueSequence(this.context, workspace, 'rebase');
      case 'skip':
        return skipSequence(this.context, workspace, 'rebase');
      case 'abort':
        return abortSequence(workspace, 'rebase');
      case 'start':
        return this.start(workspace, input.upstream);
    }
  }

  private start(workspace: Workspace, upstreamName: string): CommandOutcome {
    const repository = requireRepository(workspace);
    if (repository.operation) {
      throw new OperationInProgressError(repository.operation.type);
    }
    if (hasUnmergedPaths(repository)) {
      throw new UnmergedFilesError('Rebasing');
    }
    const status = computeStatus(repository, workspace.files);
    if (status.staged.length > 0 || status.unstaged.length > 0) {
      throw new DirtyWorkingTreeError('rebase', status.staged.length > 0);
    }

    const branch = currentBranch(repository);
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new NoCommitsYetError(branch ?? 'HEAD');
    }
    const upstream = tryResolveRevision(repository, upstreamName);
    if (upstream === null) {
      throw new InvalidUpstreamError(upstreamName);
    }
    if (isAncestor(repository, upstream, head)) {
      return succeed(
        workspace,
        `Current branch ${branch ?? 'HEAD'} is up to date.`,
        explain('rebase.upToDate', { upstream: upstreamName }),
      );
    }

    const alreadyUpstream = collectReachableCommits(repository, [upstream]);
    const todo = listCommitsInLogOrder(repository, [head])
      .filter((commit) => !alreadyUpstream.has(commit.hash) && commit.parents.length <= 1)
      .reverse()
      .map((commit) => commit.hash);

    const { index, files } = checkoutTree(
      repository,
      workspace.files,
      getCommit(repository, upstream).tree,
      'checkout',
    );
    return runSequence(
      this.context,
      { ...workspace, files, repository: { ...repository, head: detachedHead(upstream), index } },
      { kind: 'rebase', todo, origHead: head, branch, onto: upstream, total: todo.length },
    );
  }
}
