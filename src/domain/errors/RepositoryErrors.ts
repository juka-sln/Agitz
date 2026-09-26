import { GitError } from './GitError';

export class NotAGitRepositoryError extends GitError {
  readonly code = 'notAGitRepository';

  constructor() {
    super('fatal: not a git repository (or any of the parent directories): .git', 128);
  }
}

export class NoCommitsYetError extends GitError {
  readonly code = 'noCommitsYet';

  constructor(branch: string) {
    super(`fatal: your current branch '${branch}' does not have any commits yet`, 128, { branch });
  }
}

export class UnknownRevisionError extends GitError {
  readonly code = 'unknownRevision';

  constructor(revision: string) {
    super(
      [
        `fatal: ambiguous argument '${revision}': unknown revision or path not in the working tree.`,
        "Use '--' to separate paths from revisions, like this:",
        "'git <command> [<revision>...] -- [<file>...]'",
      ].join('\n'),
      128,
      { revision },
    );
  }
}

export class AmbiguousRevisionError extends GitError {
  readonly code = 'ambiguousRevision';

  constructor(revision: string) {
    super(`error: short object ID ${revision} is ambiguous`, 128, { revision });
  }
}

export class InvalidObjectNameError extends GitError {
  readonly code = 'invalidObjectName';

  constructor(name: string) {
    super(`fatal: not a valid object name: '${name}'`, 128, { name });
  }
}
