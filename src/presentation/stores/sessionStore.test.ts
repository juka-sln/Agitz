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
});
