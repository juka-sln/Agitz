export type GitHubProblemParams = Readonly<Record<string, string | number>>;

/**
 * A request the virtual GitHub refuses, like the web interface would (a disabled button,
 * a red banner). Unlike Git errors there is no exact wording to mimic: the presentation
 * layer words it from `code`.
 */
export class GitHubRuleError extends Error {
  readonly code: string;

  readonly params: GitHubProblemParams;

  constructor(code: string, params: GitHubProblemParams = {}) {
    super(`GitHub refused the request: ${code}`);
    this.name = 'GitHubRuleError';
    this.code = code;
    this.params = params;
  }
}
