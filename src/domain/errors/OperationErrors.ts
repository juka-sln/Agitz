import { GitError } from './GitError';

export class UnmergedFilesError extends GitError {
  readonly code = 'unmergedFiles';

  /** `action` is the gerund Git uses: Committing, Merging, Cherry-picking, Reverting... */
  constructor(action: string) {
    super(
      [
        `error: ${action} is not possible because you have unmerged files.`,
        "hint: Fix them up in the work tree, and then use 'git add/rm <file>'",
        'hint: as appropriate to mark resolution and make a commit.',
        'fatal: Exiting because of an unresolved conflict.',
      ].join('\n'),
      128,
      { action },
    );
  }
}

export class UnresolvedIndexError extends GitError {
  readonly code = 'unresolvedIndex';

  constructor(paths: readonly string[]) {
    super(
      [
        ...paths.map((path) => `${path}: needs merge`),
        'error: you need to resolve your current index first',
      ].join('\n'),
      1,
      { count: paths.length },
    );
  }
}

/** Another command was started while a merge, cherry-pick, revert or rebase waits to be finished. */
export class OperationInProgressError extends GitError {
  readonly code = 'operationInProgress';

  constructor(operation: string) {
    const messages: Record<string, string> = {
      merge:
        'fatal: You have not concluded your merge (MERGE_HEAD exists).\nPlease, commit your changes before you merge.',
      rebase: [
        'fatal: It seems that there is already a rebase-merge directory, and',
        'I wonder if you are in the middle of another rebase.  If that is the',
        'case, please try',
        '\tgit rebase (--continue | --abort | --skip)',
      ].join('\n'),
    };
    super(
      messages[operation] ??
        `error: ${operation} is already in progress\nhint: try "git ${operation} (--continue | --abort | --skip)"\nfatal: ${operation} failed`,
      128,
      { operation },
    );
  }
}

export class NoOperationInProgressError extends GitError {
  readonly code = 'noOperationInProgress';

  constructor(operation: string, action: string) {
    const messages: Record<string, string> = {
      'merge:abort': 'fatal: There is no merge to abort (MERGE_HEAD missing).',
      'merge:continue': 'fatal: There is no merge in progress (MERGE_HEAD missing).',
      rebase: 'fatal: No rebase in progress?',
    };
    super(
      messages[`${operation}:${action}`] ??
        messages[operation] ??
        `error: no ${operation} in progress\nfatal: ${operation} failed`,
      128,
      { operation, action },
    );
  }
}

export class NotMergeableError extends GitError {
  readonly code = 'notMergeable';

  constructor(target: string) {
    super(`merge: ${target} - not something we can merge`, 1, { target });
  }
}

export class NotPossibleToFastForwardError extends GitError {
  readonly code = 'notPossibleToFastForward';

  constructor() {
    super('fatal: Not possible to fast-forward, aborting.', 128);
  }
}

export class UnrelatedHistoriesError extends GitError {
  readonly code = 'unrelatedHistories';

  constructor() {
    super('fatal: refusing to merge unrelated histories', 128);
  }
}

export class MergeCommitWithoutMainlineError extends GitError {
  readonly code = 'mergeCommitWithoutMainline';

  constructor(commit: string) {
    super(`error: commit ${commit} is a merge but no -m option was given.`, 128, { commit });
  }
}
