import { GitError } from './GitError';

export class InvalidTagNameError extends GitError {
  readonly code = 'invalidTagName';

  constructor(name: string) {
    super(`fatal: '${name}' is not a valid tag name.`, 128, { name });
  }
}

export class TagAlreadyExistsError extends GitError {
  readonly code = 'tagAlreadyExists';

  constructor(name: string) {
    super(`fatal: tag '${name}' already exists`, 128, { name });
  }
}

export class TagNotFoundError extends GitError {
  readonly code = 'tagNotFound';

  constructor(name: string) {
    super(`error: tag '${name}' not found.`, 1, { name });
  }
}

export class EmptyTagMessageError extends GitError {
  readonly code = 'emptyTagMessage';

  constructor() {
    super('fatal: no tag message?', 128);
  }
}
