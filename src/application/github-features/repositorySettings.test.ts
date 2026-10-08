import { DEFAULT_BRANCH_PROTECTION } from '@/domain/entities/BranchProtection';
import { findBranchProtection } from '@/domain/entities/Network';
import { FEATURE, MAIN, openPullRequest } from '@/test/fixtures/pullRequestScenario';
import { ALICE_ACCOUNT, BOB_ACCOUNT, ORIGIN_URL } from '@/test/fixtures/TeamBench';

import { DeleteBranch } from './DeleteBranch';
import { UpdateBranchProtection } from './UpdateBranchProtection';

describe('UpdateBranchProtection', () => {
  const update = new UpdateBranchProtection();

  it('lets only the owner protect a branch', () => {
    const team = openPullRequest();
    const input = {
      repository: ORIGIN_URL,
      branch: 'main',
      protection: DEFAULT_BRANCH_PROTECTION,
      actor: BOB_ACCOUNT,
    };
    expect(team.web((state) => update.execute(state, input))).toEqual({
      ok: false,
      problem: { code: 'notOwner', params: { owner: 'alice' } },
    });
    team.web((state) => update.execute(state, { ...input, actor: ALICE_ACCOUNT }));
    expect(findBranchProtection(team.network, ORIGIN_URL, 'main')).toEqual(
      DEFAULT_BRANCH_PROTECTION,
    );

    team.web((state) =>
      update.execute(state, { ...input, actor: ALICE_ACCOUNT, protection: null }),
    );
    expect(findBranchProtection(team.network, ORIGIN_URL, 'main')).toBeUndefined();
  });

  it('refuses unknown branches and impossible approval counts', () => {
    const team = openPullRequest();
    const input = {
      repository: ORIGIN_URL,
      branch: 'nope',
      protection: DEFAULT_BRANCH_PROTECTION,
      actor: ALICE_ACCOUNT,
    };
    expect(team.web((state) => update.execute(state, input))).toMatchObject({
      problem: { code: 'branchNotFound' },
    });
    expect(
      team.web((state) =>
        update.execute(state, {
          ...input,
          branch: 'main',
          protection: { ...DEFAULT_BRANCH_PROTECTION, requiredApprovals: 9 },
        }),
      ),
    ).toMatchObject({ problem: { code: 'invalidApprovalCount' } });
  });
});

describe('DeleteBranch', () => {
  const remove = new DeleteBranch();

  it('deletes a merged branch but never the default or a protected one', () => {
    const team = openPullRequest();
    expect(
      team.web((state) => remove.execute(state, { repository: ORIGIN_URL, branch: MAIN })),
    ).toMatchObject({ problem: { code: 'cannotDeleteDefaultBranch' } });

    team.web((state) =>
      new UpdateBranchProtection().execute(state, {
        repository: ORIGIN_URL,
        branch: FEATURE,
        protection: DEFAULT_BRANCH_PROTECTION,
        actor: ALICE_ACCOUNT,
      }),
    );
    expect(
      team.web((state) => remove.execute(state, { repository: ORIGIN_URL, branch: FEATURE })),
    ).toMatchObject({ problem: { code: 'cannotDeleteProtectedBranch' } });
  });
});
