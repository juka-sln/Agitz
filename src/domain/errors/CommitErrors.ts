import { GitError } from './GitError';

export class EmptyCommitMessageError extends GitError {
  readonly code = 'emptyCommitMessage';

  constructor() {
    super('Aborting commit due to empty commit message.', 1);
  }
}
