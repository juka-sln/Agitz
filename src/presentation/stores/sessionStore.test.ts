import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

describe('sessionStore', () => {
  it('runs commands and records them in the terminal', () => {
    const store = createTestSessionStore(['git init', 'echo hi > a.txt']);
    const { entries, workspace, lastResult } = store.getState();

    expect(entries.map((entry) => entry.commandLine)).toEqual(['git init', 'echo hi > a.txt']);
    expect(entries[0]?.workspaceBefore.repository).toBeNull();
    expect(workspace.files).toEqual({ 'a.txt': 'hi\n' });
    expect(lastResult?.diffState.workingTreeChanged).toBe(true);
  });

  it('keeps a history without blank lines or consecutive duplicates', () => {
    const store = createTestSessionStore(['git status', 'git status', '', 'ls']);

    expect(store.getState().commandHistory).toEqual(['git status', 'ls']);
    expect(store.getState().entries).toHaveLength(4);
  });

  it('clears the screen but keeps the history', () => {
    const store = createTestSessionStore(['ls', 'clear']);

    expect(store.getState().entries).toEqual([]);
    expect(store.getState().showWelcome).toBe(false);
    expect(store.getState().commandHistory).toEqual(['ls', 'clear']);
  });

  describe('with several workstations', () => {
    it('gives each user their own files, repository and terminal', () => {
      const store = createTestSessionStore(['git init', 'echo hi > a.txt']);
      store.getState().switchUser('bob');
      const bob = store.getState();

      expect(bob.activeUser.identity.name).toBe('Bob');
      expect(bob.workspace.path).toBe('/home/bob/project');
      expect(bob.workspace.repository).toBeNull();
      expect(bob.entries).toEqual([]);
      expect(bob.showWelcome).toBe(true);

      store.getState().run('ls');
      store.getState().switchUser('alice');
      const alice = store.getState();
      expect(alice.workspace.files).toEqual({ 'a.txt': 'hi\n' });
      expect(alice.entries.map((entry) => entry.commandLine)).toEqual([
        'git init',
        'echo hi > a.txt',
      ]);
      expect(alice.otherWorkstations.bob?.commandHistory).toEqual(['ls']);
    });

    it('shares the virtual GitHub between workstations', () => {
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

      expect(store.getState().workspace.files).toEqual({ 'a.txt': 'hi\n' });
      expect(store.getState().entries[0]?.exitCode).toBe(0);
    });

    it('ignores unknown users and the active one', () => {
      const store = createTestSessionStore(['ls']);
      store.getState().switchUser('nobody');
      store.getState().switchUser('alice');

      expect(store.getState().activeUser.id).toBe('alice');
      expect(store.getState().entries).toHaveLength(1);
    });

    it('adds teammates with an empty workstation', () => {
      const store = createTestSessionStore();

      expect(store.getState().addUser('Bob')).toBe('taken');
      expect(store.getState().addUser('  ')).toBe('empty');
      expect(store.getState().addUser('Carol')).toBeNull();
      expect(store.getState().users.map((user) => user.id)).toEqual(['alice', 'bob', 'carol']);

      store.getState().switchUser('carol');
      expect(store.getState().workspace.path).toBe('/home/carol/project');
    });
  });

  describe('on the virtual GitHub', () => {
    const PUBLISH = [
      'git init',
      'mkdir .github',
      'echo "name: CI" > .github/workflows/ci.yml',
      'git add .',
      'git commit -m "ci: add workflow"',
      'git remote add origin https://github.com/alice/project.git',
      'git push -u origin main',
    ];

    it('runs the CI workflow when a push moves a branch', () => {
      const store = createTestSessionStore(PUBLISH);

      expect(store.getState().github.workflowRuns).toMatchObject([
        { id: 1, branch: 'main', conclusion: 'success' },
      ]);
    });

    it('performs web actions as the active user and reports refusals', () => {
      const store = createTestSessionStore(PUBLISH);
      const fork = () =>
        store.getState().act((actions, state) =>
          actions.forkRepository.execute(state, {
            url: 'https://github.com/alice/project.git',
            owner: store.getState().activeUser,
          }),
        );

      expect(fork()).toEqual({ code: 'cannotForkOwnRepository', params: {} });
      store.getState().switchUser('bob');
      expect(fork()).toBeNull();
      expect(Object.keys(store.getState().network.repositories)).toEqual([
        'https://github.com/alice/project.git',
        'https://github.com/bob/project.git',
      ]);
    });
  });
});
