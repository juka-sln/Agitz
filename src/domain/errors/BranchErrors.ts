import { GitError } from './GitError';

export class InvalidBranchNameError extends GitError {
  readonly code = 'invalidBranchName';

  constructor(name: string) {
    super(`fatal: '${name}' is not a valid branch name`, 128, { name });
  }
}

export class InvalidInitialBranchNameError extends GitError {
  readonly code = 'invalidInitialBranchName';

  constructor(name: string) {
    super(`fatal: invalid initial branch name: '${name}'`, 128, { name });
  }
}

export class BranchAlreadyExistsError extends GitError {
  readonly code = 'branchAlreadyExists';

  constructor(name: string) {
    super(`fatal: a branch named '${name}' already exists`, 128, { name });
  }
}

export class BranchNotFoundError extends GitError {
  readonly code = 'branchNotFound';

  constructor(name: string) {
    super(`error: branch '${name}' not found`, 1, { name });
  }
}

export class NoBranchNamedError extends GitError {
  readonly code = 'noBranchNamed';

  constructor(name: string) {
    super(`fatal: no branch named '${name}'`, 128, { name });
  }
}

export class CannotDeleteCurrentBranchError extends GitError {
  readonly code = 'cannotDeleteCurrentBranch';

  constructor(name: string, worktreePath: string) {
    super(`error: cannot delete branch '${name}' used by worktree at '${worktreePath}'`, 1, {
      name,
    });
  }
}

export class CannotForceUpdateCurrentBranchError extends GitError {
  readonly code = 'cannotForceUpdateCurrentBranch';

  constructor(name: string) {
    super(`fatal: cannot force update the branch '${name}' used by worktree`, 128, { name });
  }
}

export class BranchNotFullyMergedError extends GitError {
  readonly code = 'branchNotFullyMerged';

  constructor(name: string) {
    super(
      [
        `error: the branch '${name}' is not fully merged`,
        `hint: If you are sure you want to delete it, run 'git branch -D ${name}'`,
      ].join('\n'),
      1,
      { name },
    );
  }
}

export class DetachedHeadRenameError extends GitError {
  readonly code = 'detachedHeadRename';

  constructor() {
    super('fatal: cannot rename the current branch while not on any branch', 128);
  }
}
