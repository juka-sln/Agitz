import type { Commit } from '@/domain/entities/Commit';
import {
  addCommit,
  advanceHead,
  getHeadCommitHash,
  getHeadTree,
  type Repository,
} from '@/domain/entities/Repository';
import { treesAreEqual, type Tree } from '@/domain/entities/Tree';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { countLineChanges } from '@/domain/services/lineDiff';
import { computeStatus } from '@/domain/services/status';
import { diffTrees } from '@/domain/services/treeDiff';
import { commitSubject, createCommitMessage } from '@/domain/value-objects/CommitMessage';
import { shortHash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { pluralize } from './support/describeCommit';
import { formatLongStatus } from './support/formatStatus';
import { blobContentOrEmpty, createCommitObject, stageWorkingTreePath } from './support/objects';

export interface CommitInput {
  /** Each `-m` value becomes a paragraph, like Git does. */
  readonly messages: readonly string[];
  /** `-a`: stage modified and deleted tracked files before committing. */
  readonly all?: boolean;
  readonly allowEmpty?: boolean;
}

function formatDiffStat(repository: Repository, from: Tree, to: Tree): string[] {
  const changes = diffTrees(from, to);
  if (changes.length === 0) {
    return [];
  }

  let insertions = 0;
  let deletions = 0;
  for (const change of changes) {
    const counts = countLineChanges(
      blobContentOrEmpty(repository, change.before),
      blobContentOrEmpty(repository, change.after),
    );
    insertions += counts.insertions;
    deletions += counts.deletions;
  }

  let summary = ` ${pluralize(changes.length, 'file')} changed`;
  if (insertions > 0 || deletions === 0) {
    summary += `, ${pluralize(insertions, 'insertion')}(+)`;
  }
  if (deletions > 0 || insertions === 0) {
    summary += `, ${pluralize(deletions, 'deletion')}(-)`;
  }

  const modes = changes.flatMap((change) => {
    if (change.type === 'added') {
      return [` create mode 100644 ${change.path}`];
    }
    return change.type === 'deleted' ? [` delete mode 100644 ${change.path}`] : [];
  });
  return [summary, ...modes];
}

export class CommitCommand implements GitCommand<CommitInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: CommitInput): CommandOutcome {
    let repository = requireRepository(workspace);

    if (input.all === true) {
      repository = computeStatus(repository, workspace.files).unstaged.reduce(
        (current, change) =>
          stageWorkingTreePath(this.context.hasher, current, workspace.files, change.path),
        repository,
      );
    }

    const headTree = getHeadTree(repository);
    if (input.allowEmpty !== true && treesAreEqual(headTree, repository.index)) {
      return {
        workspace,
        output: formatLongStatus(repository, computeStatus(repository, workspace.files)),
        exitCode: 1,
        explanation: explain('commit.nothingToCommit'),
      };
    }

    const parent = getHeadCommitHash(repository);
    const commit = createCommitObject(this.context.hasher, {
      tree: repository.index,
      parents: parent === null ? [] : [parent],
      message: createCommitMessage(input.messages.join('\n\n')),
      author: workspace.identity,
      timestamp: this.context.clock.now(),
    });
    const next = advanceHead(addCommit(repository, commit), commit.hash);

    return succeed(
      { ...workspace, repository: next },
      this.formatOutput(next, commit, headTree),
      this.explainCommit(next, commit),
    );
  }

  private formatOutput(repository: Repository, commit: Commit, previousTree: Tree): string {
    const { head } = repository;
    const label = head.type === 'attached' ? head.branch : 'detached HEAD';
    const root = commit.parents.length === 0 ? ' (root-commit)' : '';
    return [
      `[${label}${root} ${shortHash(commit.hash)}] ${commitSubject(commit.message)}`,
      ...formatDiffStat(repository, previousTree, commit.tree),
    ].join('\n');
  }

  private explainCommit(repository: Repository, commit: Commit) {
    const { head } = repository;
    const params = { hash: shortHash(commit.hash), subject: commitSubject(commit.message) };
    if (head.type === 'detached') {
      return explain('commit.createdDetached', params);
    }
    return explain(commit.parents.length === 0 ? 'commit.createdRoot' : 'commit.created', {
      ...params,
      branch: head.branch,
    });
  }
}
