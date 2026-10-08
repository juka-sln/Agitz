import { createWorkspace, writeFile, type Workspace } from '@/domain/entities/Workspace';
import { FakeClock } from '@/test/doubles/FakeClock';

import { createGitEngine } from '../../GitEngine';
import { Sha1ObjectHasher } from '../../Sha1ObjectHasher';

function createRepository(): (commandLine: string) => { output: string; exitCode: number } {
  const engine = createGitEngine({ hasher: new Sha1ObjectHasher(), clock: new FakeClock() });
  let workspace: Workspace = createWorkspace('/home/alice/project', {
    name: 'Alice',
    email: 'alice@example.com',
  });
  const run = (commandLine: string) => {
    const result = engine.execute(commandLine, workspace);
    workspace = result.workspace;
    return result;
  };
  run('git init');
  workspace = writeFile(workspace, 'README.md', '# Agitz\n');
  run('git add README.md');
  run('git commit -m "docs: add readme"');
  return run;
}

describe('command line argument validation', () => {
  it.each([
    ['git remote add origin', 'error: wrong number of arguments', 129],
    ['git remote remove', 'error: wrong number of arguments', 129],
    ['git remote rename origin', 'error: wrong number of arguments', 129],
    ['git remote get-url', 'error: wrong number of arguments', 129],
    ['git remote set-url origin', 'error: wrong number of arguments', 129],
    ['git remote frobnicate', "error: unknown subcommand: `frobnicate'", 129],
    ['git clone', 'fatal: You must specify a repository to clone.', 129],
    ['git clone https://github.com/alice/project a b', 'fatal: Too many arguments.', 129],
    ['git fetch --all origin', 'fatal: fetch --all does not take a repository argument', 128],
    ['git push --delete origin', "fatal: --delete doesn't make sense without any refs", 128],
    ['git branch -u origin/main a b', 'fatal: too many arguments to set new upstream', 128],
    ['git branch -d', 'fatal: branch name required', 128],
    ['git branch -m', 'fatal: branch name required', 128],
    ['git branch -m a b c', 'fatal: too many arguments for a rename operation', 128],
    ['git branch a main extra', 'fatal: too many arguments to create a branch', 128],
    ['git merge', 'fatal: No remote for the current branch.', 128],
    ['git tag -d', 'fatal: tag name required', 128],
    ['git tag v1 main extra', 'fatal: too many arguments', 128],
    ['git rebase', 'There is no tracking information for the current branch.', 1],
  ])('rejects `%s`', (commandLine, message, exitCode) => {
    const run = createRepository();

    const result = run(commandLine);

    expect(result.output.split('\n')[0]).toBe(message);
    expect(result.exitCode).toBe(exitCode);
  });

  it.each([
    ['git remote show origin', "'git remote show'"],
    ['git remote prune origin', "'git remote prune'"],
    ['git clone https://github.com/alice/project a/b', 'cloning into a nested directory'],
    ['git pull origin main feature', 'pulling several branches at once'],
    ['git merge a b', 'merging several branches at once (octopus merge)'],
    ['git rebase -i main', 'interactive rebase (git rebase -i)'],
    ['git rebase --onto main topic', 'git rebase --onto'],
  ])('reports `%s` as not supported', (commandLine, feature) => {
    const run = createRepository();

    const result = run(commandLine);

    expect(result.output).toBe(`agitz: ${feature} is not supported yet`);
    expect(result.exitCode).toBe(1);
  });

  it('prints the usage after a usage error', () => {
    const run = createRepository();

    expect(run('git remote add origin').output).toContain('usage: git remote [-v | --verbose]');
  });

  it('forwards the in-progress actions of merge and rebase', () => {
    const run = createRepository();

    expect(run('git merge --abort').output).toBe(
      'fatal: There is no merge to abort (MERGE_HEAD missing).',
    );
    expect(run('git merge --continue').output).toBe(
      'fatal: There is no merge in progress (MERGE_HEAD missing).',
    );
    expect(run('git rebase --abort').output).toBe('fatal: No rebase in progress?');
  });

  it('manages remotes through their subcommands', () => {
    const run = createRepository();

    run('git remote add origin https://github.com/alice/project.git');
    run('git remote rename origin upstream');
    run('git remote set-url upstream https://github.com/bob/project.git');

    expect(run('git remote get-url upstream').output).toBe('https://github.com/bob/project.git');
    expect(run('git remote rm upstream').exitCode).toBe(0);
    expect(run('git remote').output).toBe('');
  });

  it('creates, lists and deletes tags', () => {
    const run = createRepository();

    run('git tag -a v1.0.0 -m "First release" -m "Details"');
    expect(run('git tag -l').output).toBe('v1.0.0');
    expect(run('git tag -d v1.0.0').output).toMatch(/^Deleted tag 'v1\.0\.0' \(was [0-9a-f]{7}\)$/);
  });

  it('unsets the upstream of a branch', () => {
    const run = createRepository();

    expect(run('git branch --unset-upstream').output).toBe(
      "fatal: branch 'main' has no upstream information",
    );
  });
});
