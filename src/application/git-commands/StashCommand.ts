import {
  currentBranch,
  getCommit,
  getHeadCommitHash,
  getHeadTree,
  type Repository,
} from '@/domain/entities/Repository';
import type { StashEntry } from '@/domain/entities/StashEntry';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { UnresolvedIndexError } from '@/domain/errors/OperationErrors';
import {
  InvalidStashReferenceError,
  NoInitialCommitError,
  NoStashEntriesError,
} from '@/domain/errors/StashErrors';
import { computeStatus } from '@/domain/services/status';
import type { Hash } from '@/domain/value-objects/Hash';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { describeCommit } from './support/describeCommit';
import { formatLongStatus } from './support/formatStatus';
import { applyMergeResult, mergeTrees } from './support/mergeTrees';
import { storeBlob } from './support/objects';
import { resetWorkingTree } from './support/resetWorkingTree';

export type StashInput =
  | {
      readonly action: 'push';
      readonly message?: string | undefined;
      /** `-u`: also set aside untracked files. */
      readonly includeUntracked?: boolean;
    }
  | { readonly action: 'list' }
  | { readonly action: 'apply' | 'pop' | 'drop'; readonly reference?: string | undefined };

const STASH_REFERENCE = /^(?:stash@\{(\d+)\}|(\d+))$/;

export class StashCommand implements GitCommand<StashInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: StashInput): CommandOutcome {
    const repository = requireRepository(workspace);
    switch (input.action) {
      case 'push':
        return this.push(workspace, repository, input.message, input.includeUntracked === true);
      case 'list':
        return succeed(
          workspace,
          repository.stash.map((entry, index) => `stash@{${index}}: ${entry.message}`).join('\n'),
          explain('stash.listed', { count: repository.stash.length }),
        );
      case 'drop':
        return this.drop(workspace, repository, this.findEntry(repository, input.reference));
      case 'apply':
      case 'pop':
        return this.apply(
          workspace,
          repository,
          this.findEntry(repository, input.reference),
          input.action === 'pop',
        );
    }
  }

  private findEntry(repository: Repository, reference: string | undefined) {
    if (repository.stash.length === 0) {
      throw new NoStashEntriesError();
    }
    const match = STASH_REFERENCE.exec(reference ?? '0');
    const index = Number(match?.[1] ?? match?.[2] ?? Number.NaN);
    const entry = repository.stash[index];
    if (entry === undefined) {
      throw new InvalidStashReferenceError(reference ?? 'stash@{0}');
    }
    return { index, entry };
  }

  private push(
    workspace: Workspace,
    repository: Repository,
    message: string | undefined,
    includeUntracked: boolean,
  ): CommandOutcome {
    const conflicted = Object.keys(repository.unmerged);
    if (conflicted.length > 0) {
      throw new UnresolvedIndexError(conflicted);
    }
    const head = getHeadCommitHash(repository);
    if (head === null) {
      throw new NoInitialCommitError();
    }
    const status = computeStatus(repository, workspace.files);
    const untracked = includeUntracked ? status.untracked : [];
    if (status.staged.length === 0 && status.unstaged.length === 0 && untracked.length === 0) {
      return succeed(workspace, 'No local changes to save', explain('stash.nothingToSave'));
    }

    let next = repository;
    const workingTree: Record<string, Hash> = {};
    const saved = [...Object.keys(repository.index), ...untracked].filter(
      (path) => workspace.files[path] !== undefined,
    );
    for (const path of saved) {
      const stored = storeBlob(this.context.hasher, next, workspace.files[path] ?? '');
      next = stored.repository;
      workingTree[path] = stored.hash;
    }

    const branch = currentBranch(repository) ?? '(no branch)';
    const description =
      message === undefined
        ? `WIP on ${branch}: ${describeCommit(getCommit(repository, head))}`
        : `On ${branch}: ${message}`;
    const createdAt = this.context.clock.now();
    const entry: StashEntry = {
      id: this.context.hasher.hash(
        `stash ${description} ${createdAt.epochSeconds} ${JSON.stringify(workingTree)}`,
      ),
      message: description,
      base: head,
      index: repository.index,
      workingTree,
      createdAt,
    };

    const headTree = getHeadTree(repository);
    const files = Object.fromEntries(
      Object.entries(resetWorkingTree(repository, workspace.files, headTree)).filter(
        ([path]) => !untracked.includes(path),
      ),
    );
    return succeed(
      {
        ...workspace,
        files,
        repository: { ...next, index: headTree, stash: [entry, ...repository.stash] },
      },
      `Saved working directory and index state ${description}`,
      explain('stash.saved', { count: saved.length }),
    );
  }

  /** Re-applies the stashed changes on top of the current HEAD with a three-way merge. */
  private apply(
    workspace: Workspace,
    repository: Repository,
    { index, entry }: { index: number; entry: StashEntry },
    drop: boolean,
  ): CommandOutcome {
    const baseTree = getCommit(repository, entry.base).tree;
    const headTree = getHeadTree(repository);
    const result = mergeTrees(
      this.context.hasher,
      repository,
      { base: baseTree, ours: headTree, theirs: entry.workingTree },
      { ours: 'Updated upstream', theirs: 'Stashed changes' },
    );
    const applied = applyMergeResult(repository, workspace.files, result, 'merge');

    // The index goes back to HEAD, except for files that were newly staged when stashing.
    const stagedAdditions: Record<string, Hash> = Object.fromEntries(
      Object.entries(entry.index).filter(
        ([path]) => baseTree[path] === undefined && !Object.hasOwn(result.conflicts, path),
      ),
    );
    const restored: Repository = {
      ...applied.repository,
      index: { ...headTree, ...stagedAdditions },
    };
    const hasConflicts = Object.keys(result.conflicts).length > 0;
    const shouldDrop = drop && !hasConflicts;
    const next = shouldDrop
      ? { ...restored, stash: restored.stash.filter((_, position) => position !== index) }
      : restored;
    const nextWorkspace = { ...workspace, files: applied.files, repository: next };

    const lines = hasConflicts
      ? [
          ...result.messages,
          ...(drop ? ['The stash entry is kept in case you need it again.'] : []),
        ]
      : [formatLongStatus(next, computeStatus(next, applied.files))];
    if (shouldDrop) {
      lines.push(`Dropped refs/stash@{${index}} (${entry.id})`);
    }
    return {
      workspace: nextWorkspace,
      output: lines.join('\n'),
      exitCode: hasConflicts ? 1 : 0,
      explanation: explain(
        hasConflicts ? 'stash.conflicts' : drop ? 'stash.popped' : 'stash.applied',
        {
          reference: `stash@{${index}}`,
        },
      ),
    };
  }

  private drop(
    workspace: Workspace,
    repository: Repository,
    { index, entry }: { index: number; entry: StashEntry },
  ): CommandOutcome {
    return succeed(
      {
        ...workspace,
        repository: {
          ...repository,
          stash: repository.stash.filter((_, position) => position !== index),
        },
      },
      `Dropped refs/stash@{${index}} (${entry.id})`,
      explain('stash.dropped', { reference: `stash@{${index}}` }),
    );
  }
}
