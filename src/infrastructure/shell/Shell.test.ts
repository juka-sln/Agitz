import { createWorkspace, type Workspace } from '@/domain/entities/Workspace';
import { FakeClock } from '@/test/doubles/FakeClock';

import { createGitEngine } from '../git-engine/GitEngine';
import { Sha1ObjectHasher } from '../git-engine/Sha1ObjectHasher';

import { createShell } from './Shell';

function createSession() {
  const shell = createShell(
    createGitEngine({ hasher: new Sha1ObjectHasher(), clock: new FakeClock() }),
  );
  let workspace: Workspace = createWorkspace('/home/alice/project', {
    name: 'Alice',
    email: 'alice@example.com',
  });
  return {
    shell,
    get workspace() {
      return workspace;
    },
    run(line: string) {
      const result = shell.execute(line, workspace);
      workspace = result.workspace;
      return result;
    },
  };
}

describe('Shell', () => {
  it('writes, appends and prints files', () => {
    const session = createSession();

    const written = session.run('echo "# Agitz" > README.md');
    expect(written.diffState.workingTreeChanged).toBe(true);
    session.run('echo Learn git >> README.md');

    expect(session.workspace.files['README.md']).toBe('# Agitz\nLearn git\n');
    expect(session.run('cat README.md').output).toBe('# Agitz\nLearn git');
    expect(session.run('echo hello world').output).toBe('hello world');
  });

  it('creates files in implicit folders and lists them', () => {
    const session = createSession();
    session.run('touch src/app.ts src/lib/util.ts notes.txt');

    expect(session.run('ls').output).toBe('notes.txt  src/');
    expect(session.run('ls src').output).toBe('app.ts  lib/');
    expect(session.run('ls nope')).toMatchObject({
      output: "ls: cannot access 'nope': No such file or directory",
      exitCode: 2,
    });
  });

  it('reveals the .git folder with ls -a once initialized', () => {
    const session = createSession();
    session.run('touch a.txt');
    expect(session.run('ls -a').output).toBe('a.txt');

    session.run('git init');
    expect(session.run('ls -a').output).toBe('.git/  a.txt');
  });

  it('removes files and folders like rm', () => {
    const session = createSession();
    session.run('touch a.txt src/b.ts');

    expect(session.run('rm src').output).toBe("rm: cannot remove 'src': Is a directory");
    session.run('rm -r src');
    session.run('rm a.txt');
    expect(session.workspace.files).toEqual({});
    expect(session.run('rm missing').exitCode).toBe(1);
    expect(session.run('rm -f missing').exitCode).toBe(0);
  });

  it('refuses invalid targets', () => {
    const session = createSession();
    session.run('touch a.txt');

    expect(session.run('echo x > a.txt/b').output).toBe('agitz: a.txt/b: Not a directory');
    expect(session.run('echo x > ../escape').output).toBe('agitz: ../escape: outside the project');
    expect(session.run('cat missing').output).toBe('cat: missing: No such file or directory');
    expect(session.run('echo x >').output).toBe(
      "agitz: syntax error near unexpected token `newline'",
    );
    expect(session.run('ls > out.txt').output).toBe(
      'agitz: output redirection is only supported with echo',
    );
  });

  it('routes git commands to the engine', () => {
    const session = createSession();
    session.run('git init');
    session.run('echo hi > a.txt');
    session.run('git add a.txt');

    expect(session.run('git commit -m "feat: add a"').output).toMatch(/^\[main \(root-commit\)/);
    expect(session.run('git status').output).toBe(
      'On branch main\nnothing to commit, working tree clean',
    );
  });

  it('explains folders instead of creating empty ones', () => {
    expect(createSession().run('mkdir src').output).toContain('touch src/index.ts');
  });

  it('reports unknown commands and lists available ones', () => {
    const session = createSession();

    expect(session.run('vim a.txt')).toMatchObject({
      output: 'vim: command not found',
      exitCode: 127,
    });
    expect(session.run('help').output).toMatch(/^Available commands:\n {2}git <command>/);
    expect(session.shell.commandNames).toContain('clear');
  });
});
