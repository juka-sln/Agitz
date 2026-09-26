export type GitErrorParams = Readonly<Record<string, string | number>>;

/**
 * Base class for every failure a real Git binary would report.
 * The message reproduces Git's own wording so the terminal output stays realistic.
 */
export abstract class GitError extends Error {
  abstract readonly code: string;

  readonly exitCode: number;

  readonly params: GitErrorParams;

  protected constructor(message: string, exitCode: number, params: GitErrorParams = {}) {
    super(message);
    this.name = new.target.name;
    this.exitCode = exitCode;
    this.params = params;
  }
}
