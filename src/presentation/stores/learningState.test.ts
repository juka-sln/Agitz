import { findAccomplishedMissions, type MissionId } from '@/application/learning/missions';
import { createConflictScenario } from '@/application/simulation/conflictScenario';
import { SHARED_REPOSITORY_URL } from '@/application/simulation/teamSetup';
import type { BranchName } from '@/domain/value-objects/BranchName';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { toLearningState } from './learningState';
import type { SessionStore } from './sessionStore';

function accomplished(store: SessionStore): MissionId[] {
  return findAccomplishedMissions(toLearningState(store.getState()), new Set());
}

const FIRST_COMMIT = [
  'git init',
  'echo hi > a.txt',
  'git add .',
  'git commit -m "feat: start"',
] as const;

const SHARED = [
  ...FIRST_COMMIT,
  `git remote add origin ${SHARED_REPOSITORY_URL}`,
  'git push -u origin main',
] as const;

function forkedHistory(store: SessionStore) {
  for (const command of [
    'git checkout -b feature',
    'echo 1 > one.txt',
    'git add .',
    'git commit -m "feat: one"',
    'git checkout main',
    'echo m > m.txt',
    'git add .',
    'git commit -m "feat: main"',
  ]) {
    store.getState().run(command);
  }
}

describe('missions', () => {
  it('starts with nothing accomplished', () => {
    expect(accomplished(createTestSessionStore(['git init', 'echo hi > a.txt']))).toEqual([]);
  });

  it('counts a first commit, and its message when it follows the convention', () => {
    expect(accomplished(createTestSessionStore(FIRST_COMMIT))).toEqual([
      'first-commit',
      'conventional-commit',
    ]);
    expect(
      accomplished(
        createTestSessionStore(['git init', 'echo hi > a.txt', 'git add .', 'git commit -m "wip"']),
      ),
    ).toEqual(['first-commit']);
  });

  it('counts branching out, then merging and rebasing', () => {
    const merged = createTestSessionStore(FIRST_COMMIT);
    forkedHistory(merged);
    expect(accomplished(merged)).toContain('branch-out');
    expect(accomplished(merged)).not.toContain('merge-branches');
    merged.getState().run('git merge feature -m "Merge branch feature"');
    expect(accomplished(merged)).toContain('merge-branches');

    const rebased = createTestSessionStore(FIRST_COMMIT);
    forkedHistory(rebased);
    rebased.getState().run('git checkout feature');
    rebased.getState().run('git rebase main');
    expect(accomplished(rebased)).toContain('rebase-branch');
  });

  it('counts undoing, stashing and tagging a release', () => {
    const store = createTestSessionStore([
      ...FIRST_COMMIT,
      'git tag v0.1',
      'echo more >> a.txt',
      'git stash',
      'git stash pop',
    ]);
    expect(accomplished(store)).toContain('stash-work');
    expect(accomplished(store)).not.toContain('tag-release');
    expect(accomplished(store)).not.toContain('undo-change');

    store.getState().run('git tag v1.0.0');
    store.getState().run('git commit -am "fix: more"');
    store.getState().run('git revert HEAD');
    expect(accomplished(store)).toEqual(expect.arrayContaining(['tag-release', 'undo-change']));
  });

  it('counts pushing, then working with a teammate', () => {
    const store = createTestSessionStore(SHARED);
    expect(accomplished(store)).toContain('push-to-github');
    expect(accomplished(store)).not.toContain('work-as-a-team');

    store.getState().switchUser('bob');
    for (const command of [
      `git clone ${SHARED_REPOSITORY_URL}`,
      'echo bob > b.txt',
      'git add .',
      'git commit -m "feat: add b"',
      'git push',
    ]) {
      store.getState().run(command);
    }
    expect(accomplished(store)).toContain('work-as-a-team');
  });

  it('counts a conflict only once it is resolved and concluded', () => {
    const store = createTestSessionStore();
    const [alice, bob] = store.getState().users;
    if (alice === undefined || bob === undefined) {
      throw new Error('The default team has two users');
    }
    store.getState().play(createConflictScenario(alice, bob, SHARED_REPOSITORY_URL));
    expect(accomplished(store)).not.toContain('resolve-conflict');

    store.getState().saveFile('README.md', '# Bakery\nOpen every day.\n');
    store.getState().run('git add README.md');
    expect(accomplished(store)).not.toContain('resolve-conflict');
    store.getState().run('git commit -m "Merge opening hours"');
    expect(accomplished(store)).toContain('resolve-conflict');
  });

  it('counts a pull request merged on GitHub', () => {
    const store = createTestSessionStore([
      ...SHARED,
      'git checkout -b feature/menu',
      'echo menu > menu.txt',
      'git add .',
      'git commit -m "feat: add menu"',
      'git push -u origin feature/menu',
    ]);
    const author = store.getState().activeUser;
    const opened = store.getState().act((actions, state) =>
      actions.createPullRequest.execute(state, {
        repository: SHARED_REPOSITORY_URL,
        base: 'main' as BranchName,
        head: { repository: SHARED_REPOSITORY_URL, branch: 'feature/menu' as BranchName },
        title: 'feat: add menu',
        body: 'Adds the menu.',
        author,
      }),
    );
    expect(opened).toBeNull();
    expect(accomplished(store)).not.toContain('merge-pull-request');

    store.getState().act((actions, state) =>
      actions.mergePullRequest.execute(state, {
        repository: SHARED_REPOSITORY_URL,
        number: 1,
        method: 'merge',
        actor: author,
      }),
    );
    expect(accomplished(store)).toContain('merge-pull-request');
  });

  it('skips missions already accomplished', () => {
    const state = toLearningState(createTestSessionStore(FIRST_COMMIT).getState());

    expect(findAccomplishedMissions(state, new Set(['first-commit']))).toEqual([
      'conventional-commit',
    ]);
  });
});
