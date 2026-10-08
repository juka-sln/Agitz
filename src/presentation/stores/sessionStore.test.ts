import { createConflictScenario } from '@/application/simulation/conflictScenario';
import { SHARED_REPOSITORY_URL } from '@/application/simulation/teamSetup';
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

  describe('as a text editor', () => {
    it('saves files on the active workstation', () => {
      const store = createTestSessionStore(['git init']);

      expect(store.getState().saveFile('docs/notes.md', 'hello\n')).toBeNull();
      expect(store.getState().workspace.files).toEqual({ 'docs/notes.md': 'hello\n' });
    });

    it('refuses paths that cannot hold a file', () => {
      const store = createTestSessionStore(['echo hi > docs/notes.md']);
      const { saveFile } = store.getState();

      expect(saveFile('../outside.txt', '')).toBe('invalidPath');
      expect(saveFile('docs', '')).toBe('isDirectory');
      expect(saveFile('docs/notes.md/more.txt', '')).toBe('parentIsFile');
      expect(store.getState().workspace.files).toEqual({ 'docs/notes.md': 'hi\n' });
    });
  });

  describe('with scripted scenarios', () => {
    it('plays the conflict scenario up to the conflicting merge', () => {
      const store = createTestSessionStore();
      const { users, play } = store.getState();
      const [alice, bob] = users;
      if (alice === undefined || bob === undefined) {
        throw new Error('The default team has two users');
      }

      play(createConflictScenario(alice, bob, SHARED_REPOSITORY_URL));
      const state = store.getState();

      expect(state.activeUser.id).toBe('alice');
      expect(state.entries.slice(0, -1).filter((entry) => entry.exitCode !== 0)).toEqual([]);
      expect(state.entries.at(-1)?.output).toContain(
        'CONFLICT (content): Merge conflict in README.md',
      );
      expect(state.otherWorkstations.bob?.entries.length).toBeGreaterThan(0);
      expect(state.workspace.files['README.md']).toBe(
        [
          '# Bakery',
          'Fresh bread every morning.',
          '<<<<<<< HEAD',
          'Open from 7am to 7pm, closed on Sundays.',
          '=======',
          'Open every day from 6am to 8pm.',
          '>>>>>>> origin/docs/opening-hours',
          '',
        ].join('\n'),
      );
    });

    it('starts over from the initial team', () => {
      const store = createTestSessionStore(['git init', 'echo hi > a.txt']);
      store.getState().addUser('Carol');
      store.getState().switchUser('bob');

      store.getState().reset();
      const state = store.getState();

      expect(state.activeUser.id).toBe('alice');
      expect(state.users.map((user) => user.id)).toEqual(['alice', 'bob']);
      expect(state.workspace.repository).toBeNull();
      expect(state.entries).toEqual([]);
      expect(state.showWelcome).toBe(true);
    });
  });
});
