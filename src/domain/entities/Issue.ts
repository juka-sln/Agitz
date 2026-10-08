import type { SimulatedUser } from './SimulatedUser';

export type IssueState = 'open' | 'closed';

export interface Issue {
  /** Canonical URL of the repository the issue belongs to. */
  readonly repository: string;
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly author: SimulatedUser;
  readonly labels: readonly string[];
  readonly state: IssueState;
  /** The pull request whose merge closed the issue, if any. */
  readonly closedByPullRequest: number | null;
}

/** The labels every new GitHub repository starts with. */
export const DEFAULT_LABELS = [
  'bug',
  'documentation',
  'duplicate',
  'enhancement',
  'good first issue',
  'help wanted',
  'question',
] as const;

export type Label = (typeof DEFAULT_LABELS)[number];

export function isLabel(name: string): name is Label {
  return (DEFAULT_LABELS as readonly string[]).includes(name);
}
