import { summarizeReviews } from '@/domain/entities/PullRequest';
import { createSimulatedUser } from '@/domain/entities/SimulatedUser';
import { openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { ALICE_ACCOUNT, BOB_ACCOUNT, ORIGIN_URL } from '@/test/fixtures/TeamBench';

import { RequestReview } from './RequestReview';
import { ReviewPullRequest, type ReviewPullRequestInput } from './ReviewPullRequest';

describe('ReviewPullRequest', () => {
  const review = new ReviewPullRequest();
  const input: ReviewPullRequestInput = {
    repository: ORIGIN_URL,
    number: 1,
    reviewer: ALICE_ACCOUNT,
    verdict: 'approve',
    body: '',
  };

  it('records approvals and keeps only the latest verdict of each reviewer', () => {
    const team = openPullRequest();
    const carol = createSimulatedUser('Carol');
    team.web((state) =>
      review.execute(state, { ...input, verdict: 'requestChanges', body: 'Add a test' }),
    );
    team.web((state) => review.execute(state, { ...input, reviewer: carol }));
    team.web((state) => review.execute(state, input));
    team.web((state) => review.execute(state, { ...input, verdict: 'comment', body: 'Nice' }));

    const pullRequest = team.github.pullRequests[0];
    expect(pullRequest?.reviews.map((entry) => entry.verdict)).toEqual([
      'requestChanges',
      'approve',
      'approve',
      'comment',
    ]);
    expect(pullRequest && summarizeReviews(pullRequest)).toEqual({
      approvedBy: ['alice', 'carol'],
      changesRequestedBy: [],
    });
  });

  it('lets authors comment on their pull request but not approve it', () => {
    const team = openPullRequest();
    const own = { ...input, reviewer: BOB_ACCOUNT };
    expect(team.web((state) => review.execute(state, own))).toEqual({
      ok: false,
      problem: { code: 'cannotApproveOwn', params: {} },
    });
    expect(
      team.web((state) => review.execute(state, { ...own, verdict: 'comment', body: 'Ready' })).ok,
    ).toBe(true);
    expect(
      team.web((state) => review.execute(state, { ...own, verdict: 'comment', body: ' ' })),
    ).toMatchObject({ ok: false, problem: { code: 'reviewBodyRequired' } });
  });
});

describe('RequestReview', () => {
  it('approves a pull request that follows the conventions', () => {
    const team = openPullRequest();
    team.web((state) =>
      new RequestReview(team.context.hasher).execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        reviewer: ALICE_ACCOUNT,
      }),
    );

    expect(team.github.pullRequests[0]?.reviews).toEqual([
      { author: ALICE_ACCOUNT, verdict: 'approve', body: '', remarks: [{ kind: 'looksGood' }] },
    ]);
  });

  it('requests changes, explaining what to fix', () => {
    const team = openPullRequest(
      [
        ['Added greeting', { 'hello.txt': 'Hello\n' }],
        ['fix: markers', { 'notes.txt': '<<<<<<< HEAD\nA\n=======\nB\n>>>>>>> other\n' }],
      ],
      { title: 'Greeting', body: '' },
    );
    team.web((state) =>
      new RequestReview(team.context.hasher).execute(state, {
        repository: ORIGIN_URL,
        number: 1,
        reviewer: ALICE_ACCOUNT,
      }),
    );

    expect(team.github.pullRequests[0]?.reviews[0]).toEqual({
      author: ALICE_ACCOUNT,
      verdict: 'requestChanges',
      body: '',
      remarks: [
        { kind: 'titleNotConventional', title: 'Greeting' },
        { kind: 'emptyDescription' },
        { kind: 'commitNotConventional', subject: 'Added greeting' },
        { kind: 'conflictMarkers', path: 'notes.txt' },
      ],
    });
  });
});
