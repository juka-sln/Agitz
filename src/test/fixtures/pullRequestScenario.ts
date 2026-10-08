import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { CreatePullRequest } from '@/application/github-features/CreatePullRequest';
import type { BranchName } from '@/domain/value-objects/BranchName';

import { BOB_ACCOUNT, ORIGIN_URL, TeamBench } from './TeamBench';

export const FEATURE = 'feature/greeting' as BranchName;

export const MAIN = 'main' as BranchName;

/** Bob pushes `feature/greeting` with the given commits, then opens pull request #1 to `main`. */
export function openPullRequest(
  commits: readonly (readonly [string, Readonly<Record<string, string>>])[] = [
    ['feat: add greeting', { 'hello.txt': 'Hello\n' }],
  ],
  details: { readonly title?: string; readonly body?: string } = {},
): TeamBench {
  const team = new TeamBench().share();
  team.bob.run(new CheckoutCommand(team.context), { targets: [], newBranch: FEATURE });
  for (const [message, files] of commits) {
    team.bob.commit(message, files);
  }
  team.online(team.bob, new PushCommand(), { remote: 'origin', refspecs: [FEATURE] });
  const result = team.web((state) =>
    new CreatePullRequest().execute(state, {
      repository: ORIGIN_URL,
      base: MAIN,
      head: { repository: ORIGIN_URL, branch: FEATURE },
      title: details.title ?? 'feat: add greeting',
      body: details.body ?? 'Greets the visitor.',
      author: BOB_ACCOUNT,
    }),
  );
  if (!result.ok) {
    throw new Error(`Could not open the pull request: ${result.problem.code}`);
  }
  return team;
}
