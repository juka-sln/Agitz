import type { SimulatedUser } from '@/domain/entities/SimulatedUser';

/** A command typed in the terminal of a given teammate. */
export interface ScriptStep {
  readonly userId: string;
  readonly commandLine: string;
}

function writeReadme(openingHours: string): string[] {
  return [
    'echo "# Bakery" > README.md',
    'echo "Fresh bread every morning." >> README.md',
    `echo "${openingHours}" >> README.md`,
  ];
}

/**
 * Two teammates change the same line of the same file on two branches, then the owner
 * merges the other branch: Git stops on a conflict in `README.md`.
 */
export function createConflictScenario(
  owner: SimulatedUser,
  teammate: SimulatedUser,
  repositoryUrl: string,
): ScriptStep[] {
  const as = (user: SimulatedUser, commandLines: readonly string[]) =>
    commandLines.map((commandLine) => ({ userId: user.id, commandLine }));

  return [
    ...as(owner, [
      'git init',
      ...writeReadme('Open from 7am to 7pm.'),
      'git add README.md',
      'git commit -m "docs: add README"',
      `git remote add origin ${repositoryUrl}`,
      'git push -u origin main',
    ]),
    ...as(teammate, [
      `git clone ${repositoryUrl}`,
      'git checkout -b docs/opening-hours',
      ...writeReadme('Open every day from 6am to 8pm.'),
      'git add README.md',
      'git commit -m "docs: extend opening hours"',
      'git push -u origin docs/opening-hours',
    ]),
    ...as(owner, [
      ...writeReadme('Open from 7am to 7pm, closed on Sundays.'),
      'git add README.md',
      'git commit -m "docs: mention the Sunday closure"',
      'git fetch',
      'git merge origin/docs/opening-hours',
    ]),
  ];
}
