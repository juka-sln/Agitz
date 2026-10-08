import { requireRepository, type Workspace } from '@/domain/entities/Workspace';
import { PathspecNotMatchedError } from '@/domain/errors/WorkingTreeErrors';
import { parsePathspec } from '@/domain/services/pathspec';
import { diffTrees } from '@/domain/services/treeDiff';
import { compareByteOrder } from '@/domain/value-objects/FilePath';

import {
  explain,
  succeed,
  type CommandOutcome,
  type GitCommand,
  type GitCommandContext,
} from './GitCommand';
import { stageWorkingTreePath } from './support/objects';

export interface AddInput {
  readonly pathspecs: readonly string[];
  /** `-A`: stage every change, including new files, when no pathspec is given. */
  readonly all?: boolean;
  /** `-u`: only stage changes to files that are already tracked. */
  readonly update?: boolean;
}

const NOTHING_SPECIFIED = [
  'Nothing specified, nothing added.',
  "hint: Maybe you wanted to say 'git add .'?",
].join('\n');

export class AddCommand implements GitCommand<AddInput> {
  private readonly context: GitCommandContext;

  constructor(context: GitCommandContext) {
    this.context = context;
  }

  execute(workspace: Workspace, input: AddInput): CommandOutcome {
    const repository = requireRepository(workspace);
    const stageEverything = input.all === true || input.update === true;

    if (input.pathspecs.length === 0 && !stageEverything) {
      return succeed(workspace, NOTHING_SPECIFIED, explain('add.nothingSpecified'));
    }

    const pathspecs = (input.pathspecs.length > 0 ? input.pathspecs : ['.']).map((raw) =>
      parsePathspec(raw, workspace.path),
    );
    const trackedPaths = [...Object.keys(repository.index), ...Object.keys(repository.unmerged)];
    const candidates =
      input.update === true
        ? trackedPaths
        : [...new Set([...trackedPaths, ...Object.keys(workspace.files)])];

    const matchedPaths = new Set<string>();
    for (const pathspec of pathspecs) {
      const matches = candidates.filter(pathspec.matches);
      if (matches.length === 0) {
        throw new PathspecNotMatchedError(pathspec.original);
      }
      matches.forEach((path) => matchedPaths.add(path));
    }

    const staged = [...matchedPaths]
      .sort(compareByteOrder)
      .reduce(
        (current, path) =>
          stageWorkingTreePath(this.context.hasher, current, workspace.files, path),
        repository,
      );
    const changes = diffTrees(repository.index, staged.index);
    // Staging a conflicted path is how Git marks the conflict as resolved.
    const unmerged = Object.fromEntries(
      Object.entries(repository.unmerged).filter(([path]) => !matchedPaths.has(path)),
    );
    const resolved = Object.keys(repository.unmerged).length - Object.keys(unmerged).length;

    return succeed(
      { ...workspace, repository: { ...staged, unmerged } },
      '',
      resolved > 0
        ? explain('add.resolvedConflicts', { count: resolved })
        : changes.length === 0
          ? explain('add.nothingChanged')
          : explain('add.staged', {
              count: changes.length,
              paths: changes.map((change) => change.path).join(', '),
            }),
    );
  }
}
