import { BranchCommand } from '@/application/git-commands/BranchCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { TagCommand } from '@/application/git-commands/TagCommand';
import { ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { getHostedRepositories } from './getHostedRepositories';

describe('getHostedRepositories', () => {
  it('lists the default branch first, then the others and the tags', () => {
    const team = new TeamBench().share();
    team.alice.run(new BranchCommand(), { action: 'create', name: 'develop' });
    team.alice.run(new TagCommand(team.context), { action: 'create', name: 'v1.0.0' });
    team.online(team.alice, new PushCommand(), {
      remote: 'origin',
      refspecs: ['develop'],
      tags: true,
    });
    const tip = team.alice.headCommit.hash;

    expect(getHostedRepositories(team.network)).toEqual([
      {
        url: ORIGIN_URL,
        branches: [
          { name: 'main', tip, isDefault: true },
          { name: 'develop', tip, isDefault: false },
        ],
        tags: ['v1.0.0'],
      },
    ]);
  });
});
