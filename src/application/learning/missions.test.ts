import { EMPTY_GITHUB } from '@/domain/entities/GitHub';
import { EMPTY_NETWORK } from '@/domain/entities/Network';
import { createWorkspace } from '@/domain/entities/Workspace';
import { buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import {
  findAccomplishedMissions,
  MISSION_IDS,
  MISSIONS,
  type CommandRecord,
  type LearningState,
} from './missions';

const ROOT = fakeHash('a1');

function stateWith(message: string, commands: readonly CommandRecord[] = []): LearningState {
  const workspace = {
    ...createWorkspace('/home/alice/project', { name: 'Alice', email: 'alice@agitz.dev' }),
    repository: buildRepository([{ hash: ROOT, message }], { main: ROOT }),
  };
  return {
    workstations: [{ workspace, commands }],
    network: EMPTY_NETWORK,
    github: EMPTY_GITHUB,
  };
}

const NOTHING_YET: LearningState = {
  workstations: [
    {
      workspace: createWorkspace('/home/alice/project', {
        name: 'Alice',
        email: 'alice@agitz.dev',
      }),
      commands: [],
    },
  ],
  network: EMPTY_NETWORK,
  github: EMPTY_GITHUB,
};

describe('missions', () => {
  it('follows the order of the course', () => {
    expect(MISSIONS.map((mission) => mission.id)).toEqual(MISSION_IDS);
  });

  it('finds nothing before the first commit', () => {
    expect(findAccomplishedMissions(NOTHING_YET, new Set())).toEqual([]);
  });

  it('counts a conventional first commit twice', () => {
    expect(findAccomplishedMissions(stateWith('feat: start'), new Set())).toEqual([
      'first-commit',
      'conventional-commit',
    ]);
  });

  it('does not take a free-form message for a conventional one', () => {
    expect(findAccomplishedMissions(stateWith('Initial commit'), new Set())).toEqual([
      'first-commit',
    ]);
  });

  it('leaves out the missions already done', () => {
    expect(findAccomplishedMissions(stateWith('feat: start'), new Set(['first-commit']))).toEqual([
      'conventional-commit',
    ]);
  });

  it('only counts commands that succeeded', () => {
    const failed = { commandLine: 'git stash pop', exitCode: 1, output: 'No stash entries found.' };
    const popped = { ...failed, exitCode: 0, output: 'Dropped refs/stash@{0}' };

    expect(findAccomplishedMissions(stateWith('wip', [failed]), new Set())).not.toContain(
      'stash-work',
    );
    expect(findAccomplishedMissions(stateWith('wip', [popped]), new Set())).toContain('stash-work');
  });
});
