import { CloneCommand } from '@/application/git-commands/CloneCommand';
import { DEFAULT_BRANCH_PROTECTION } from '@/domain/entities/BranchProtection';
import { findProject } from '@/domain/entities/GitHub';
import { findHostedRepository, setBranchProtection } from '@/domain/entities/Network';
import { ALICE_ACCOUNT, BOB_ACCOUNT, ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CreateRepository } from './CreateRepository';
import { ForkRepository } from './ForkRepository';

const FORK_URL = 'https://github.com/bob/project.git';

describe('ForkRepository', () => {
  const fork = new ForkRepository();

  it('copies the history under the new owner and remembers the original', () => {
    const team = new TeamBench().share();
    team.network = setBranchProtection(team.network, ORIGIN_URL, 'main', DEFAULT_BRANCH_PROTECTION);

    expect(
      team.web((state) => fork.execute(state, { url: ORIGIN_URL, owner: BOB_ACCOUNT })).ok,
    ).toBe(true);
    expect(findProject(team.github, FORK_URL)).toEqual({
      url: FORK_URL,
      owner: 'bob',
      name: 'project',
      parent: ORIGIN_URL,
    });
    const copy = findHostedRepository(team.network, FORK_URL);
    expect(copy?.branches).toEqual(team.hosted.branches);
    expect(copy?.head).toEqual(team.hosted.head);
    expect(team.network.protections[FORK_URL]).toBeUndefined();

    const other = new TeamBench();
    other.network = team.network;
    other.online(other.bob, new CloneCommand(), { url: FORK_URL });
    expect(other.bob.workspace.files).toEqual({ 'README.md': 'Hello\n' });
  });

  it('refuses to fork your own repository or to fork twice', () => {
    const team = new TeamBench().share();
    expect(
      team.web((state) => fork.execute(state, { url: ORIGIN_URL, owner: ALICE_ACCOUNT })),
    ).toEqual({
      ok: false,
      problem: { code: 'cannotForkOwnRepository', params: {} },
    });
    team.web((state) => fork.execute(state, { url: ORIGIN_URL, owner: BOB_ACCOUNT }));
    expect(
      team.web((state) => fork.execute(state, { url: ORIGIN_URL, owner: BOB_ACCOUNT })),
    ).toEqual({
      ok: false,
      problem: { code: 'alreadyForked', params: { name: 'bob/project' } },
    });
  });
});

describe('CreateRepository', () => {
  const create = new CreateRepository();

  it('creates an empty repository owned by the user', () => {
    const team = new TeamBench();
    team.web((state) => create.execute(state, { owner: BOB_ACCOUNT, name: 'website' }));

    expect(findProject(team.github, 'https://github.com/bob/website')?.owner).toBe('bob');
    expect(findHostedRepository(team.network, 'https://github.com/bob/website')?.commits).toEqual(
      {},
    );
  });

  it.each([
    ['my site', 'invalidRepositoryName'],
    ['project', 'repositoryExists'],
  ])('refuses the name %s', (name, code) => {
    const team = new TeamBench();
    const result = team.web((state) => create.execute(state, { owner: ALICE_ACCOUNT, name }));
    expect(result.ok ? null : result.problem.code).toBe(code);
  });
});
