import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { isSessionSnapshot, takeSnapshot, type SessionSnapshot } from './sessionSnapshot';

/** What the browser hands back: plain JSON, without any shared references. */
function throughJson(snapshot: SessionSnapshot): unknown {
  return JSON.parse(JSON.stringify(snapshot));
}

function savedSession() {
  const store = createTestSessionStore([
    'git init',
    'echo hi > a.txt',
    'git add .',
    'git commit -m "feat: start"',
    'git remote add origin https://github.com/alice/project.git',
    'git push -u origin main',
  ]);
  store.getState().switchUser('bob');
  store.getState().run('git clone https://github.com/alice/project.git');
  store.getState().addUser('Carol');
  const saved = throughJson(takeSnapshot(store.getState()));
  if (!isSessionSnapshot(saved)) {
    throw new Error('The snapshot should be valid');
  }
  return { store, saved };
}

describe('session snapshots', () => {
  it('resumes every workstation, the virtual GitHub and the active user', () => {
    const { store, saved } = savedSession();
    const resumed = createTestSessionStore([], saved).getState();
    const original = store.getState();

    expect(resumed.activeUser).toEqual(original.activeUser);
    expect(resumed.users.map((user) => user.id)).toEqual(['alice', 'bob', 'carol']);
    expect(resumed.workspace).toEqual(original.workspace);
    expect(resumed.entries).toEqual(original.entries);
    expect(resumed.commandHistory).toEqual(original.commandHistory);
    expect(resumed.otherWorkstations.alice).toEqual({
      ...original.otherWorkstations.alice,
      lastResult: null,
    });
    expect(resumed.otherWorkstations.carol).toEqual(original.otherWorkstations.carol);
    expect(resumed.network).toEqual(original.network);
    expect(resumed.github).toEqual(original.github);
    expect(resumed.lastResult).toBeNull();
  });

  it('keeps working after a resume, with fresh terminal entry ids', () => {
    const { saved } = savedSession();
    const store = createTestSessionStore([], saved);
    store.getState().run('git pull');
    store.getState().switchUser('alice');
    store.getState().run('git log --oneline');

    const ids = [store.getState(), ...Object.values(store.getState().otherWorkstations)].flatMap(
      (workstation) => workstation.entries.map((entry) => entry.id),
    );
    expect(new Set(ids).size).toBe(ids.length);
    expect(store.getState().entries.at(-1)?.output).toContain('feat: start');
  });

  it('rejects saves from another version or with a missing active workstation', () => {
    const { saved } = savedSession();

    expect(isSessionSnapshot(saved)).toBe(true);
    expect(isSessionSnapshot({ ...saved, version: 0 })).toBe(false);
    expect(isSessionSnapshot({ ...saved, activeUserId: 'nobody' })).toBe(false);
    expect(isSessionSnapshot({ ...saved, workstations: [{}] })).toBe(false);
    expect(isSessionSnapshot(null)).toBe(false);
    expect(isSessionSnapshot('{}')).toBe(false);
  });

  it('starts over with the initial team after a resume', () => {
    const { saved } = savedSession();
    const store = createTestSessionStore([], saved);
    store.getState().reset();

    expect(store.getState().users.map((user) => user.id)).toEqual(['alice', 'bob']);
    expect(store.getState().workspace.repository).toBeNull();
  });
});
