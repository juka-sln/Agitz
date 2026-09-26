import {
  addCommit,
  advanceHead,
  currentBranch,
  findBranch,
  findTag,
  getCommit,
  getHeadCommitHash,
  getHeadTree,
  hasUnmergedPaths,
  type Repository,
} from '@/domain/entities/Repository';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  NoOperationInProgressError,
  NotMergeableError,
  NotPossibleToFastForwardError,
  OperationInProgressError,
  UnmergedFilesError,
  UnrelatedHistoriesError,
} from '@/domain/errors/OperationErrors';
import { NoCommitsYetError } from '@/domain/errors/RepositoryErrors';
import { checkoutTree } from '@/domain/services/checkoutTree';
import { findMergeBase, isAncestor } from '@/domain/services/history';
import { tryResolveRevision } from '@/domain/services/revision';
import { createCommitMessage } from '@/domain/value-objects/CommitMessage';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { CommitCommand } from './CommitCommand';
import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { formatDiffStat } from './support/diffStat';
import { applyMergeResult, mergeTrees } from './support/mergeTrees';
import { createCommitObject } from './support/objects';
import { resetWorkingTree } from './support/resetWorkingTree';

export type MergeInput =
  | {
      readonly action: 'merge';
      readonly target: string;
      /** `--no-ff`: always create a merge commit, even when a fast-forward is possible. */
      readonly noFastForward?: boolean;
      /** `--ff-only`: refuse anything but a fast-forward. */
      readonly fastForwardOnly?: boolean;
      readonly message?: string | undefined;
    }
  | { readonly action: 'abort' }
  | { readonly action: 'continue' };

const DEFAULT_BRANCHES = new Set(['main', 'master']);

/** Git's default message: `Merge branch 'feature'`, plus ` into dev` outside the default branch. */
export function defaultMergeMessage(repository: Repository, target: string): string {
  let kind = 'commit';
  if (findTag(repository, target) !== undefined) {
    kind = 'tag';
  } else if (findBranch(repository, target) !== undefined) {
    kind = 'branch';
  }
  const branch = currentBranch(repository);
  const destination = branch === null || DEFAULT_BRANCHES.has(branch) ? '' : ` into ${branch}`;
  return `Merge ${kind} '${target}'${destination}`;
}

export class MergeCommand implements GitCommand<MergeInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: MergeInput): CommandOutcome {
    const repository = requireRepository(workspace);
    if (input.action === 'abort') {
      return this.abort(workspace, repository);
    }
    if (input.action === 'continue') {
      if (repository.operation?.type !== 'merge') {
        throw new NoOperationInProgressError('merge', 'continue');
      }
      return new CommitCommand(this.context).execute(workspace, { messages: [] });
    }

    if (hasUnmergedPaths(repository)) {
      throw new UnmergedFilesError('Merging');
    }
    if (repository.operation) {
      throw new OperationInProgressError(repository.operation.type);
    }
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new NoCommitsYetError(currentBranch(repository) ?? 'HEAD');
    }
    const theirs = tryResolveRevision(repository, input.target);
    if (theirs === null) {
      throw new NotMergeableError(input.target);
    }

    if (isAncestor(repository, theirs, head)) {
      return succeed(
        workspace,
        'Already up to date.',
        explain('merge.upToDate', { target: input.target }),
      );
    }
    const canFastForward = isAncestor(repository, head, theirs);
    if (canFastForward && input.noFastForward !== true) {
      return this.fastForward(workspace, repository, head, theirs);
    }
    if (input.fastForwardOnly === true) {
      throw new NotPossibleToFastForwardError();
    }
    return this.threeWayMerge(workspace, repository, head, theirs, input.target, input.message);
  }

  private fastForward(
    workspace: Workspace,
    repository: Repository,
    head: Hash,
    theirs: Hash,
  ): CommandOutcome {
    const target = getCommit(repository, theirs);
    const { index, files } = checkoutTree(repository, workspace.files, target.tree, 'merge');
    const next = { ...advanceHead(repository, theirs), index };
    return succeed(
      { ...workspace, files, repository: next },
      [
        `Updating ${shortHash(head)}..${shortHash(theirs)}`,
        'Fast-forward',
        ...formatDiffStat(repository, getHeadTree(repository), target.tree, { perFile: true }),
      ].join('\n'),
      explain('merge.fastForward', { from: shortHash(head), to: shortHash(theirs) }),
    );
  }

  private threeWayMerge(
    workspace: Workspace,
    repository: Repository,
    head: Hash,
    theirs: Hash,
    target: string,
    message: string | undefined,
  ): CommandOutcome {
    const base = findMergeBase(repository, head, theirs);
    if (base === null) {
      throw new UnrelatedHistoriesError();
    }
    const headTree = getHeadTree(repository);
    const result = mergeTrees(
      this.context.hasher,
      repository,
      {
        base: getCommit(repository, base).tree,
        ours: headTree,
        theirs: getCommit(repository, theirs).tree,
      },
      { ours: 'HEAD', theirs: target },
    );
    const applied = applyMergeResult(repository, workspace.files, result, 'merge');
    const mergeMessage = message ?? defaultMergeMessage(repository, target);
    const conflicts = Object.keys(result.conflicts).length;

    if (conflicts > 0) {
      return {
        workspace: {
          ...workspace,
          files: applied.files,
          repository: {
            ...applied.repository,
            operation: { type: 'merge', theirs, message: mergeMessage, origHead: head },
          },
        },
        output: [
          ...result.messages,
          'Automatic merge failed; fix conflicts and then commit the result.',
        ].join('\n'),
        exitCode: 1,
        explanation: explain('merge.conflicts', { target, count: conflicts }),
      };
    }

    const commit = createCommitObject(this.context.hasher, {
      tree: result.tree,
      parents: [head, theirs],
      message: createCommitMessage(mergeMessage),
      author: workspace.identity,
      timestamp: this.context.clock.now(),
    });
    const next = advanceHead(addCommit(applied.repository, commit), commit.hash);
    return succeed(
      { ...workspace, files: applied.files, repository: next },
      [
        ...result.messages,
        "Merge made by the 'ort' strategy.",
        ...formatDiffStat(next, headTree, result.tree, { perFile: true }),
      ].join('\n'),
      explain('merge.merged', { target, commit: shortHash(commit.hash) }),
    );
  }

  /** `git merge --abort`: back to the state before the merge started. */
  private abort(workspace: Workspace, repository: Repository): CommandOutcome {
    const { operation } = repository;
    if (operation?.type !== 'merge') {
      throw new NoOperationInProgressError('merge', 'abort');
    }
    const origTree = getCommit(repository, operation.origHead).tree;
    const files = resetWorkingTree(repository, workspace.files, origTree);
    return succeed(
      {
        ...workspace,
        files,
        repository: { ...repository, index: origTree, unmerged: {}, operation: null },
      },
      '',
      explain('merge.aborted'),
    );
  }
}
