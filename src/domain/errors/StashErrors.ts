import { GitError } from './GitError';

export class NoStashEntriesError extends GitError {
  readonly code = 'noStashEntries';

  constructor() {
    super('No stash entries found.', 1);
  }
}

export class InvalidStashReferenceError extends GitError {
  readonly code = 'invalidStashReference';

  constructor(reference: string) {
    super(`error: ${reference} is not a valid reference`, 1, { reference });
  }
}

export class NoInitialCommitError extends GitError {
  readonly code = 'noInitialCommit';

  constructor() {
    super('You do not have the initial commit yet', 1);
  }
}
