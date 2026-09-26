import {
  advanceHead,
  getBlobContent,
  getCommit,
  getHeadCommitHash,
  getHeadTree,
  type Repository,
} from '@/domain/entities/Repository';
import { EMPTY_TREE, type Tree } from '@/domain/entities/Tree';
import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { PathspecNotKnownError, ResetWithPathsError } from '@/domain/errors/WorkingTreeErrors';
import { parsePathspec } from '@/domain/services/pathspec';
import { resolveRevision, tryResolveRevision } from '@/domain/services/revision';
import { computeStatus } from '@/domain/services/status';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { explain, succeed, type CommandOutcome, type GitCommand } from './GitCommand';
import { describeCommit } from './support/describeCommit';

export type ResetMode = 'soft' | 'mixed' | 'hard';

export interface ResetInput {
  readonly mode?: ResetMode | undefined;
  /** Arguments before `--`: a commit, optionally followed by paths. */
  readonly targets: readonly string[];
  /** Arguments after `--`, always paths. */
  readonly paths?: readonly string[] | undefined;
}

/** `M\tfile` lines for the changes left in the working tree, as printed after a mixed reset. */
function unstagedChangesMessage(repository: Repository, workspace: Workspace): string {
  const status = computeStatus(repository, workspace.files);
  const codes = { added: 'A', modified: 'M', deleted: 'D' } as const;
  if (status.unstaged.length === 0) {
    return '';
  }
  return [
    'Unstaged changes after reset:',
    ...status.unstaged.map(({ path, type }) => `${codes[type]}\t${path}`),
  ].join('\n');
}

export class ResetCommand implements GitCommand<ResetInput> {
  execute(workspace: Workspace, input: ResetInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const [first, ...rest] = input.targets;
    const explicitPaths = input.paths ?? [];

    if (explicitPaths.length > 0) {
      return this.resetPaths(workspace, repository, input.mode, first, [...rest, ...explicitPaths]);
    }
    if (first !== undefined && tryResolveRevision(repository, first) === null) {
      return this.resetPaths(workspace, repository, input.mode, undefined, input.targets);
    }
    if (rest.length > 0) {
      return this.resetPaths(workspace, repository, input.mode, first, rest);
    }
    return this.resetHead(workspace, repository, input.mode ?? 'mixed', first);
  }

  private resetHead(
    workspace: Workspace,
    repository: Repository,
    mode: ResetMode,
    target: string | undefined,
  ): CommandOutcome {
    const targetHash =
      target === undefined ? getHeadCommitHash(repository) : resolveRevision(repository, target);
    const targetTree = targetHash === null ? EMPTY_TREE : getCommit(repository, targetHash).tree;
    const moved = targetHash === null ? repository : advanceHead(repository, targetHash);
    const params = { mode, commit: targetHash === null ? '' : shortHash(targetHash) };

    if (mode === 'soft') {
      return succeed({ ...workspace, repository: moved }, '', explain('reset.soft', params));
    }

    const next: Repository = { ...moved, index: targetTree, unmerged: {}, operation: null };
    if (mode === 'mixed') {
      return succeed(
        { ...workspace, repository: next },
        unstagedChangesMessage(next, workspace),
        explain('reset.mixed', params),
      );
    }

    const files = this.overwriteTrackedFiles(repository, workspace, targetTree);
    return succeed(
      { ...workspace, files, repository: next },
      targetHash === null
        ? ''
        : `HEAD is now at ${describeCommit(getCommit(repository, targetHash))}`,
      explain('reset.hard', params),
    );
  }

  /** `--hard`: every tracked file takes the target's version; untracked files are left alone. */
  private overwriteTrackedFiles(repository: Repository, workspace: Workspace, target: Tree) {
    const files = new Map(Object.entries(workspace.files));
    const tracked = new Set([
      ...Object.keys(repository.index),
      ...Object.keys(getHeadTree(repository)),
      ...Object.keys(repository.unmerged),
      ...Object.keys(target),
    ]);
    for (const path of tracked) {
      const blob = target[path];
      if (blob === undefined) {
        files.delete(path);
      } else {
        files.set(path, getBlobContent(repository, blob));
      }
    }
    return Object.fromEntries(files);
  }

  /** `git reset [<commit>] -- <paths>`: copy the commit's version of the paths into the index (unstage). */
  private resetPaths(
    workspace: Workspace,
    repository: Repository,
    mode: ResetMode | undefined,
    source: string | undefined,
    rawPathspecs: readonly string[],
  ): CommandOutcome {
    if (mode === 'soft' || mode === 'hard') {
      throw new ResetWithPathsError(mode);
    }
    const sourceTree =
      source === undefined
        ? getHeadTree(repository)
        : getCommit(repository, resolveRevision(repository, source)).tree;
    const candidates = new Set([
      ...Object.keys(repository.index),
      ...Object.keys(repository.unmerged),
      ...Object.keys(sourceTree),
    ]);

    const index = new Map<string, Hash>(Object.entries(repository.index));
    const unmerged = { ...repository.unmerged };
    for (const pathspec of rawPathspecs.map((raw) => parsePathspec(raw, workspace.path))) {
      const matches = [...candidates].filter(pathspec.matches);
      if (matches.length === 0) {
        throw new PathspecNotKnownError(pathspec.original);
      }
      for (const path of matches) {
        const blob = sourceTree[path];
        if (blob === undefined) {
          index.delete(path);
        } else {
          index.set(path, blob);
        }
        Reflect.deleteProperty(unmerged, path);
      }
    }

    const next: Repository = { ...repository, index: Object.fromEntries(index), unmerged };
    return succeed(
      { ...workspace, repository: next },
      unstagedChangesMessage(next, workspace),
      explain('reset.paths', { count: rawPathspecs.length }),
    );
  }
}
