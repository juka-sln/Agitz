import { createWorkspace, writeFile, type Workspace } from '@/domain/entities/Workspace';
import { FakeClock } from '@/test/doubles/FakeClock';

import { createGitEngine } from './GitEngine';
import { Sha1ObjectHasher } from './Sha1ObjectHasher';

function createSession() {
  const engine = createGitEngine({ hasher: new Sha1ObjectHasher(), clock: new FakeClock() });
  let workspace: Workspace = createWorkspace('/home/alice/project', {
    name: 'Alice',
    email: 'alice@example.com',
  });
  return {
    engine,
    get workspace() {
      return workspace;
    },
    write(path: string, content: string) {
      workspace = writeFile(workspace, path, content);
    },
    run(commandLine: string) {
      const result = engine.execute(commandLine, workspace);
      workspace = result.workspace;
      return result;
    },
  };
}

describe('GitEngine', () => {
  it('runs a complete feature branch workflow from command lines', () => {
    const session = createSession();

    expect(session.run('git status').exitCode).toBe(128);
    expect(session.run('git init').output).toBe(
      'Initialized empty Git repository in /home/alice/project/.git/',
    );

    session.write('README.md', '# Agitz\n');
    session.run('git add README.md');
    const root = session.run('git commit -m "docs: add readme"');
    expect(root.output).toMatch(/^\[main \(root-commit\) [0-9a-f]{7}\] docs: add readme\n/);
    expect(root.diffState.createdCommits).toHaveLength(1);

    expect(session.run('git checkout -b feature/login').output).toBe(
      "Switched to a new branch 'feature/login'",
    );
    session.write('login.ts', 'export {};\n');
    session.run('git add .');
    session.run("git commit -m 'feat: add login page'");

    session.run('git checkout main');
    expect(session.workspace.files).toEqual({ 'README.md': '# Agitz\n' });

    const log = session.run('git log --oneline --all');
    expect(log.output.split('\n')).toEqual([
      expect.stringMatching(/^[0-9a-f]{7} \(feature\/login\) feat: add login page$/),
      expect.stringMatching(/^[0-9a-f]{7} \(HEAD -> main\) docs: add readme$/),
    ]);
    expect(session.run('git branch').output).toBe('  feature/login\n* main');
    expect(session.run('git log -1 --oneline').output).toMatch(/docs: add readme$/);
  });

  it('supports bundled flags such as -am', () => {
    const session = createSession();
    session.run('git init');
    session.write('a.txt', 'v1\n');
    session.run('git add -A');
    session.run('git commit -m "feat: add a"');
    session.write('a.txt', 'v2\n');

    expect(session.run('git commit -am "fix: update a"').exitCode).toBe(0);
    expect(session.run('git status -s').output).toBe('');
  });

  it('maps branch options to the right operation', () => {
    const session = createSession();
    session.run('git init');
    session.write('a.txt', 'a\n');
    session.run('git add .');
    session.run('git commit -m "feat: add a"');

    session.run('git branch topic');
    session.run('git branch -m topic renamed');
    expect(session.run('git branch -v').output).toMatch(/^ {2}renamed [0-9a-f]{7} feat: add a$/m);
    expect(session.run('git branch -d renamed').output).toMatch(/^Deleted branch renamed/);
    expect(session.run('git branch -d').output).toBe('fatal: branch name required');
  });

  it('restores files with checkout --', () => {
    const session = createSession();
    session.run('git init');
    session.write('a.txt', 'good\n');
    session.run('git add .');
    session.run('git commit -m "feat: add a"');
    session.write('a.txt', 'broken\n');

    expect(session.run('git checkout -- a.txt').output).toBe('Updated 1 path from the index');
    expect(session.workspace.files['a.txt']).toBe('good\n');
  });

  it('reports usage errors with exit code 129', () => {
    const session = createSession();
    session.run('git init');
    const result = session.run('git commit --amend');

    expect(result.exitCode).toBe(129);
    expect(result.output).toMatch(/^error: unknown option `amend'\nusage: git commit/);
    expect(result.explanation.key).toBe('error.usage');
  });

  it('handles shell-level mistakes', () => {
    const session = createSession();

    expect(session.run('').exitCode).toBe(0);
    expect(session.run('ls -la')).toMatchObject({ output: 'ls: command not found', exitCode: 127 });
    expect(session.run('git commit -m "oops').exitCode).toBe(2);
  });

  it('suggests commands and flags planned ones', () => {
    const session = createSession();

    expect(session.run('git comit').output).toBe(
      "git: 'comit' is not a git command. See 'git --help'.\n\nThe most similar command is\n\tcommit",
    );
    expect(session.run('git merge feature')).toMatchObject({
      output: "agitz: 'git merge' is not available yet",
      exitCode: 1,
      explanation: { key: 'shell.notImplemented', params: { command: 'merge' } },
    });
  });

  it('prints help and version', () => {
    const session = createSession();
    const help = session.run('git');

    expect(help.exitCode).toBe(1);
    expect(help.output).toContain('   checkout   Switch branches or restore working tree files');
    expect(session.run('git --version').output).toBe('git version 2.46.0');
    expect(session.engine.availableCommands).toEqual([
      'init',
      'add',
      'status',
      'commit',
      'log',
      'branch',
      'checkout',
    ]);
  });
});
