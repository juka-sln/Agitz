import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import { PushCommand } from '@/application/git-commands/PushCommand';
import { ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { findLatestRun } from './runWorkflows';

const WORKFLOW = { '.github/workflows/ci.yml': 'name: CI\n' };

describe('runWorkflows', () => {
  it('does nothing until the repository declares a workflow', () => {
    const team = new TeamBench().share();
    expect(team.github.workflowRuns).toEqual([]);
  });

  it('runs the workflow on each pushed branch and checks the new commits', () => {
    const team = new TeamBench().share();
    team.alice.commit('ci: add workflow', WORKFLOW);
    team.online(team.alice, new PushCommand(), {});

    expect(team.github.workflowRuns).toEqual([
      {
        id: 1,
        repository: ORIGIN_URL,
        branch: 'main',
        commit: team.alice.headCommit.hash,
        conclusion: 'success',
        jobs: [
          { name: 'commitlint', conclusion: 'success', problems: [] },
          { name: 'build', conclusion: 'success', problems: [] },
        ],
      },
    ]);

    team.alice.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'wip' });
    team.alice.commit('wip', { 'app.txt': '<<<<<<< HEAD\nA\n=======\nB\n>>>>>>> wip\n' });
    team.online(team.alice, new PushCommand(), { remote: 'origin', refspecs: ['wip'] });

    const run = findLatestRun(
      team.github.workflowRuns,
      'https://github.com/alice/project.git',
      team.alice.headCommit.hash,
    );
    expect(run).toMatchObject({
      id: 2,
      branch: 'wip',
      conclusion: 'failure',
      jobs: [
        {
          name: 'commitlint',
          conclusion: 'failure',
          problems: [
            { kind: 'commitNotConventional', commit: team.alice.headCommit.hash, subject: 'wip' },
          ],
        },
        {
          name: 'build',
          conclusion: 'failure',
          problems: [{ kind: 'conflictMarkers', path: 'app.txt' }],
        },
      ],
    });
  });
});
