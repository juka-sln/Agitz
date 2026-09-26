import type { Commit } from '@/domain/entities/Commit';
import {
  addCommit,
  advanceHead,
  getHeadCommitHash,
  getCommit,
  getHeadTree,
  hasUnmergedPaths,
  type Repository,
} from '@/domain/entities/Repository';
import { EMPTY_TREE, treesAreEqual, type Tree } from '@/domain/entities/Tree';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { AmendDuringMergeError, NothingToAmendError } from '@/domain/errors/CommitErrors';
import { UnmergedFilesError } from '@/domain/errors/OperationErrors';
import { computeStatus } from '@/domain/services/status';
import { commitSubject, createCommitMessage } from '@/domain/value-objects/CommitMessage';
import { shortHash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { formatDiffStat } from './support/diffStat';
import { formatGitDate } from './support/formatDate';
import { formatLongStatus } from './support/formatStatus';
import { createCommitObject, stageWorkingTreePath } from './support/objects';
import { sequenceMessage } from './support/sequencer';

export interface CommitInput {
  /** Each `-m` value becomes a paragraph, like Git does. */
  readonly messages: readonly string[];
  /** `-a`: stage modified and deleted tracked files before committing. */
  readonly all?: boolean;
  readonly allowEmpty?: boolean;
  /** `--amend`: replace the last commit instead of adding a new one. */
  readonly amend?: boolean;
}

export class CommitCommand implements GitCommand<CommitInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: CommitInput): CommandOutcome {
    let repository = requireRepository(workspace);
    if (hasUnmergedPaths(repository)) {
      throw new UnmergedFilesError('Committing');
    }
    const { operation } = repository;
    const pendingMerge = operation?.type === 'merge' ? operation : null;
    const pendingSequence = operation !== null && operation.type !== 'merge' ? operation : null;

    if (input.all === true) {
      repository = computeStatus(repository, workspace.files).unstaged.reduce(
        (current, change) =>
          stageWorkingTreePath(this.context.hasher, current, workspace.files, change.path),
        repository,
      );
    }

    if (input.amend === true) {
      return this.amend(workspace, repository, input.messages, pendingMerge !== null);
    }

    const headTree = getHeadTree(repository);
    // A merge commit records that two histories were joined, even when the tree does not change.
    if (
      input.allowEmpty !== true &&
      pendingMerge === null &&
      treesAreEqual(headTree, repository.index)
    ) {
      return {
        workspace,
        output: formatLongStatus(repository, computeStatus(repository, workspace.files)),
        exitCode: 1,
        explanation: explain('commit.nothingToCommit'),
      };
    }

    const parent = getHeadCommitHash(repository);
    const parents = parent === null ? [] : [parent];
    if (pendingMerge) {
      parents.push(pendingMerge.theirs);
    }
    let message = input.messages.join('\n\n');
    if (input.messages.length === 0 && pendingMerge) {
      message = pendingMerge.message;
    } else if (input.messages.length === 0 && pendingSequence) {
      message = sequenceMessage(
        pendingSequence.type,
        getCommit(repository, pendingSequence.current),
      );
    }
    const commit = createCommitObject(this.context.hasher, {
      tree: repository.index,
      parents,
      message: createCommitMessage(message),
      author: workspace.identity,
      timestamp: this.context.clock.now(),
    });
    // A rebase, or a sequence with commits left, keeps going with `--continue`.
    const finishesOperation =
      pendingMerge !== null ||
      (pendingSequence !== null &&
        pendingSequence.type !== 'rebase' &&
        pendingSequence.todo.length === 0);
    const next = {
      ...advanceHead(addCommit(repository, commit), commit.hash),
      operation: finishesOperation ? null : operation,
    };

    return succeed(
      { ...workspace, repository: next },
      this.formatOutput(next, commit, headTree),
      this.explainCommit(next, commit),
    );
  }

  /** Rewrites HEAD: same parents and author, new tree and possibly a new message. */
  private amend(
    workspace: Workspace,
    repository: Repository,
    messages: readonly string[],
    isMerging: boolean,
  ): CommandOutcome {
    if (isMerging) {
      throw new AmendDuringMergeError();
    }
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new NothingToAmendError();
    }
    const previous = getCommit(repository, head);
    const commit = createCommitObject(this.context.hasher, {
      tree: repository.index,
      parents: previous.parents,
      message:
        messages.length === 0 ? previous.message : createCommitMessage(messages.join('\n\n')),
      author: previous.author,
      timestamp: previous.authoredAt,
      committer: { identity: workspace.identity, timestamp: this.context.clock.now() },
    });
    const next = advanceHead(addCommit(repository, commit), commit.hash);
    const parentTree =
      previous.parents[0] === undefined
        ? EMPTY_TREE
        : getCommit(repository, previous.parents[0]).tree;

    const { head: headRef } = next;
    const label = headRef.type === 'attached' ? headRef.branch : 'detached HEAD';
    return succeed(
      { ...workspace, repository: next },
      [
        `[${label} ${shortHash(commit.hash)}] ${commitSubject(commit.message)}`,
        ` Date: ${formatGitDate(commit.authoredAt)}`,
        ...formatDiffStat(next, parentTree, commit.tree, { perFile: false }),
      ].join('\n'),
      explain('commit.amended', { hash: shortHash(commit.hash), previous: shortHash(head) }),
    );
  }

  private formatOutput(repository: Repository, commit: Commit, previousTree: Tree): string {
    const { head } = repository;
    const label = head.type === 'attached' ? head.branch : 'detached HEAD';
    const root = commit.parents.length === 0 ? ' (root-commit)' : '';
    return [
      `[${label}${root} ${shortHash(commit.hash)}] ${commitSubject(commit.message)}`,
      ...(commit.parents.length > 1
        ? []
        : formatDiffStat(repository, previousTree, commit.tree, { perFile: false })),
    ].join('\n');
  }

  private explainCommit(repository: Repository, commit: Commit) {
    const { head } = repository;
    const params = { hash: shortHash(commit.hash), subject: commitSubject(commit.message) };
    if (head.type === 'detached') {
      return explain('commit.createdDetached', params);
    }
    if (commit.parents.length > 1) {
      return explain('commit.createdMerge', { ...params, branch: head.branch });
    }
    return explain(commit.parents.length === 0 ? 'commit.createdRoot' : 'commit.created', {
      ...params,
      branch: head.branch,
    });
  }
}
