import { GitError } from './GitError';

export class InvalidPathError extends GitError {
  readonly code = 'invalidPath';

  constructor(path: string, repositoryPath: string) {
    super(`fatal: '${path}' is outside repository at '${repositoryPath}'`, 128, { path });
  }
}

export class PathspecNotMatchedError extends GitError {
  readonly code = 'pathspecNotMatched';

  constructor(pathspec: string) {
    super(`fatal: pathspec '${pathspec}' did not match any files`, 128, { pathspec });
  }
}

export class PathspecNotKnownError extends GitError {
  readonly code = 'pathspecNotKnown';

  constructor(pathspec: string) {
    super(`error: pathspec '${pathspec}' did not match any file(s) known to git`, 1, { pathspec });
  }
}

/** How Git ends its "would be overwritten" advice depending on the command. */
function beforeYou(operation: string): string {
  return operation === 'checkout' ? 'before you switch branches.' : 'before you merge.';
}

export class LocalChangesWouldBeOverwrittenError extends GitError {
  readonly code = 'localChangesWouldBeOverwritten';

  constructor(operation: string, paths: readonly string[]) {
    super(
      [
        `error: Your local changes to the following files would be overwritten by ${operation}:`,
        ...paths.map((path) => `\t${path}`),
        `Please commit your changes or stash them ${beforeYou(operation)}`,
        'Aborting',
      ].join('\n'),
      1,
      { operation, count: paths.length },
    );
  }
}

export class UntrackedFilesWouldBeOverwrittenError extends GitError {
  readonly code = 'untrackedFilesWouldBeOverwritten';

  constructor(operation: string, paths: readonly string[]) {
    super(
      [
        `error: The following untracked working tree files would be overwritten by ${operation}:`,
        ...paths.map((path) => `\t${path}`),
        `Please move or remove them ${beforeYou(operation)}`,
        'Aborting',
      ].join('\n'),
      1,
      { operation, count: paths.length },
    );
  }
}
