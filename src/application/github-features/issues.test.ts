import { ALICE_ACCOUNT, ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CreateIssue } from './CreateIssue';
import { UpdateIssue } from './UpdateIssue';

describe('issues', () => {
  function withIssue() {
    const team = new TeamBench();
    team.web((state) =>
      new CreateIssue().execute(state, {
        repository: ORIGIN_URL,
        title: ' Crash on empty input ',
        body: 'Steps to reproduce...',
        labels: ['bug', 'good first issue', 'bug'],
        author: ALICE_ACCOUNT,
      }),
    );
    return team;
  }

  it('opens an issue with known labels', () => {
    expect(withIssue().github.issues).toEqual([
      {
        repository: ORIGIN_URL,
        number: 1,
        title: 'Crash on empty input',
        body: 'Steps to reproduce...',
        author: ALICE_ACCOUNT,
        labels: ['bug', 'good first issue'],
        state: 'open',
        closedByPullRequest: null,
      },
    ]);
  });

  it('refuses unknown labels and empty titles', () => {
    const team = new TeamBench();
    const create = (title: string, labels: string[]) =>
      team.web((state) =>
        new CreateIssue().execute(state, {
          repository: ORIGIN_URL,
          title,
          body: '',
          labels,
          author: ALICE_ACCOUNT,
        }),
      );
    expect(create('Idea', ['urgent'])).toMatchObject({
      problem: { code: 'unknownLabel', params: { label: 'urgent' } },
    });
    expect(create('', [])).toMatchObject({ problem: { code: 'titleRequired' } });
  });

  it('closes, reopens and relabels an issue', () => {
    const team = withIssue();
    const update = new UpdateIssue();
    team.web((state) =>
      update.execute(state, { repository: ORIGIN_URL, number: 1, state: 'closed' }),
    );
    expect(team.github.issues[0]?.state).toBe('closed');

    team.web((state) =>
      update.execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        state: 'open',
        labels: ['question'],
      }),
    );
    expect(team.github.issues[0]).toMatchObject({ state: 'open', labels: ['question'] });
  });
});
