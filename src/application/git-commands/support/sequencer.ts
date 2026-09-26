import type { Commit } from '@/domain/entities/Commit';
import { attachedHead } from '@/domain/entities/Head';
import type { PendingSequence } from '@/domain/entities/PendingOperation';
import {
  addCommit,
  advanceHead,
  getCommit,
  getHeadCommitHash,
  getHeadTree,
  hasUnmergedPaths,
  setBranch,
  type Repository,
} from '@/domain/entities/Repository';
import { EMPTY_TREE, treesAreEqual } from '@/domain/entities/Tree';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import {
  MergeCommitWithoutMainlineError,
  NoOperationInProgressError,
  UnmergedFilesError,
} from '@/domain/errors/OperationErrors';
import {
  commitSubject,
  createCommitMessage,
  type CommitMessage,
} from '@/domain/value-objects/CommitMessage';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { explain, type CommandOutcome, type GitCommandContext } from '../GitCommand';

import { describeCommit } from './describeCommit';
import { formatDiffStat } from './diffStat';
import { formatGitDate } from './formatDate';
import { applyMergeResult, mergeTrees } from './mergeTrees';
import { createCommitObject } from './objects';
import { resetWorkingTree } from './resetWorkingTree';

export type SequenceKind = PendingSequence['type'];

/** The message a replayed commit gets: the original one, or `Revert "..."` for a revert. */
export function sequenceMessage(kind: SequenceKind, commit: Commit): CommitMessage {
  if (kind !== 'revert') {
    return commit.message;
  }
  return createCommitMessage(
    `Revert "${commitSubject(commit.message)}"\n\nThis reverts commit ${commit.hash}.`,
  );
}

function conflictHints(kind: SequenceKind, commit: Commit): string[] {
  const described = describeCommit(commit);
  if (kind === 'rebase') {
    return [
      `error: could not apply ${described.replace(' ', '... ')}`,
      'hint: Resolve all conflicts manually, mark them as resolved with',
      'hint: "git add/rm <conflicted_files>", then run "git rebase --continue".',
      'hint: You can instead skip this commit: run "git rebase --skip".',
      'hint: To abort and get back to the state before "git rebase", run "git rebase --abort".',
      `Could not apply ${described.replace(' ', '... ')}`,
    ];
  }
  const verb = kind === 'revert' ? 'revert' : 'apply';
  return [
    `error: could not ${verb} ${described.replace(' ', '... ')}`,
    'hint: After resolving the conflicts, mark them with',
    'hint: "git add/rm <pathspec>", then run',
    `hint: "git ${kind} --continue".`,
    `hint: You can instead skip this commit with "git ${kind} --skip".`,
    `hint: To abort and get back to the state before "git ${kind}",`,
    `hint: run "git ${kind} --abort".`,
  ];
}

interface SequenceState {
  readonly kind: SequenceKind;
  readonly todo: readonly Hash[];
  readonly origHead: Hash;
  readonly branch: PendingSequence['branch'];
  readonly onto: Hash | null;
  readonly total: number;
}

/** Records the index as a commit replaying `original` (same message, and same author unless reverting). */
function commitReplay(
  context: GitCommandContext,
  workspace: Workspace,
  repository: Repository,
  kind: SequenceKind,
  original: Commit,
): { repository: Repository; lines: string[] } {
  const head = getHeadCommitHash(repository);
  const now = context.clock.now();
  const keepsAuthor = kind !== 'revert';
  const commit = createCommitObject(context.hasher, {
    tree: repository.index,
    parents: head === null ? [] : [head],
    message: sequenceMessage(kind, original),
    author: keepsAuthor ? original.author : workspace.identity,
    timestamp: keepsAuthor ? original.authoredAt : now,
    committer: { identity: workspace.identity, timestamp: now },
  });
  const next = advanceHead(addCommit(repository, commit), commit.hash);
  if (kind === 'rebase') {
    return { repository: next, lines: [] };
  }
  const label = repository.head.type === 'attached' ? repository.head.branch : 'detached HEAD';
  return {
    repository: next,
    lines: [
      `[${label} ${shortHash(commit.hash)}] ${commitSubject(commit.message)}`,
      ...(kind === 'cherry-pick' ? [` Date: ${formatGitDate(commit.authoredAt)}`] : []),
      ...formatDiffStat(next, getHeadTree(repository), commit.tree, { perFile: false }),
    ],
  };
}

function finish(
  workspace: Workspace,
  repository: Repository,
  state: SequenceState,
  lines: string[],
): CommandOutcome {
  let next: Repository = { ...repository, operation: null };
  if (state.kind === 'rebase') {
    const head = getHeadCommitHash(repository);
    if (state.branch !== null && head !== null) {
      next = { ...setBranch(next, state.branch, head), head: attachedHead(state.branch) };
    }
    lines.push(
      state.branch === null
        ? 'Successfully rebased and updated detached HEAD.'
        : `Successfully rebased and updated refs/heads/${state.branch}.`,
    );
  }
  return {
    workspace: { ...workspace, repository: next },
    output: lines.join('\n'),
    exitCode: 0,
    explanation: explain(`${state.kind}.done`, { count: state.total }),
  };
}

/**
 * Replays the remaining commits one after the other on top of HEAD. Stops at the
 * first conflict, recording where it stopped so the user can resolve and continue.
 */
export function runSequence(
  context: GitCommandContext,
  initial: Workspace,
  state: SequenceState,
  previousLines: readonly string[] = [],
): CommandOutcome {
  let workspace = initial;
  let repository = requireRepository(workspace);
  const lines = [...previousLines];

  for (const [position, hash] of state.todo.entries()) {
    const original = getCommit(repository, hash);
    if (original.parents.length > 1) {
      throw new MergeCommitWithoutMainlineError(shortHash(hash));
    }
    const parentTree =
      original.parents[0] === undefined
        ? EMPTY_TREE
        : getCommit(repository, original.parents[0]).tree;
    const [base, theirs] =
      state.kind === 'revert' ? [original.tree, parentTree] : [parentTree, original.tree];
    const theirsLabel = `${state.kind === 'revert' ? 'parent of ' : ''}${shortHash(hash)} (${commitSubject(original.message)})`;

    const result = mergeTrees(
      context.hasher,
      repository,
      { base, ours: getHeadTree(repository), theirs },
      { ours: 'HEAD', theirs: theirsLabel },
    );
    const applied = applyMergeResult(repository, workspace.files, result, 'merge');
    workspace = { ...workspace, files: applied.files };
    repository = applied.repository;
    lines.push(...result.messages);

    const hasConflicts = Object.keys(result.conflicts).length > 0;
    if (hasConflicts) {
      const operation: PendingSequence = {
        type: state.kind,
        current: hash,
        todo: state.todo.slice(position + 1),
        origHead: state.origHead,
        branch: state.branch,
        onto: state.onto,
        total: state.total,
      };
      return {
        workspace: { ...workspace, repository: { ...repository, operation } },
        output: [...lines, ...conflictHints(state.kind, original)].join('\n'),
        exitCode: 1,
        explanation: explain(`${state.kind}.conflicts`, {
          commit: shortHash(hash),
          count: Object.keys(result.conflicts).length,
        }),
      };
    }

    // A commit whose changes are already present has nothing left to record: it is dropped.
    if (treesAreEqual(repository.index, getHeadTree(repository))) {
      continue;
    }
    const replayed = commitReplay(context, workspace, repository, state.kind, original);
    repository = replayed.repository;
    lines.push(...replayed.lines);
    workspace = { ...workspace, repository };
  }

  return finish({ ...workspace, repository }, repository, state, lines);
}

function requireSequence(
  repository: Repository,
  kind: SequenceKind,
  action: string,
): PendingSequence {
  const { operation } = repository;
  if (operation?.type !== kind) {
    throw new NoOperationInProgressError(kind, action);
  }
  return operation;
}

const stateOf = (operation: PendingSequence): SequenceState => ({
  kind: operation.type,
  todo: operation.todo,
  origHead: operation.origHead,
  branch: operation.branch,
  onto: operation.onto,
  total: operation.total,
});

/** `--continue`: record the resolved commit (unless already committed), then replay the rest. */
export function continueSequence(
  context: GitCommandContext,
  workspace: Workspace,
  kind: SequenceKind,
): CommandOutcome {
  const repository = requireRepository(workspace);
  const operation = requireSequence(repository, kind, 'continue');
  if (hasUnmergedPaths(repository)) {
    throw new UnmergedFilesError('Committing');
  }
  let next = repository;
  let lines: string[] = [];
  if (!treesAreEqual(repository.index, getHeadTree(repository))) {
    const replayed = commitReplay(
      context,
      workspace,
      repository,
      kind,
      getCommit(repository, operation.current),
    );
    next = replayed.repository;
    lines = replayed.lines;
  }
  return runSequence(
    context,
    { ...workspace, repository: { ...next, operation: null } },
    stateOf(operation),
    lines,
  );
}

/** `--skip`: drop the commit that stopped the sequence and replay the rest. */
export function skipSequence(
  context: GitCommandContext,
  workspace: Workspace,
  kind: SequenceKind,
): CommandOutcome {
  const repository = requireRepository(workspace);
  const operation = requireSequence(repository, kind, 'skip');
  const headTree = getHeadTree(repository);
  const files = resetWorkingTree(repository, workspace.files, headTree);
  return runSequence(
    context,
    {
      ...workspace,
      files,
      repository: { ...repository, index: headTree, unmerged: {}, operation: null },
    },
    stateOf(operation),
  );
}

/** `--abort`: go back to where the sequence started, on the original branch. */
export function abortSequence(workspace: Workspace, kind: SequenceKind): CommandOutcome {
  const repository = requireRepository(workspace);
  const operation = requireSequence(repository, kind, 'abort');
  const origTree = getCommit(repository, operation.origHead).tree;
  const files = resetWorkingTree(repository, workspace.files, origTree);

  let next: Repository = { ...repository, index: origTree, unmerged: {}, operation: null };
  if (kind === 'rebase' && operation.branch !== null) {
    next = {
      ...setBranch(next, operation.branch, operation.origHead),
      head: attachedHead(operation.branch),
    };
  } else {
    next = advanceHead(next, operation.origHead);
  }
  return {
    workspace: { ...workspace, files, repository: next },
    output: '',
    exitCode: 0,
    explanation: explain(`${kind}.aborted`),
  };
}
