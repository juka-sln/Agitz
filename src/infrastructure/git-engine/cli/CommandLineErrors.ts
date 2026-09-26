import { GitError } from '@/domain/errors/GitError';

/** Invalid options or arguments; Git exits with 129 and prints the usage. */
export class UsageError extends GitError {
  readonly code = 'usage';

  constructor(message: string, usage: string) {
    super(`${message}\nusage: ${usage}`, 129, { usage });
  }
}

export class CommandLineError extends GitError {
  readonly code = 'commandLine';

  constructor(message: string, exitCode = 128) {
    super(message, exitCode);
  }
}

/** A real Git feature that the simulator does not provide (yet). */
export class NotSupportedError extends GitError {
  readonly code = 'notSupported';

  constructor(feature: string) {
    super(`agitz: ${feature} is not supported yet`, 1, { feature });
  }
}
