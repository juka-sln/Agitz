import { GitError } from './GitError';

export class EmptyCommitMessageError extends GitError {
  readonly code = 'emptyCommitMessage';

  constructor() {
    super('Aborting commit due to empty commit message.', 1);
  }
}

export class NothingToAmendError extends GitError {
  readonly code = 'nothingToAmend';

  constructor() {
    super('fatal: You have nothing to amend.', 128);
  }
}

export class AmendDuringMergeError extends GitError {
  readonly code = 'amendDuringMerge';

  constructor() {
    super('fatal: You are in the middle of a merge -- cannot amend.', 128);
  }
}
