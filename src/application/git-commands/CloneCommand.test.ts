import { shortHash } from '@/domain/value-objects/Hash';
import { ORIGIN_URL, TeamBench } from '@/test/fixtures/TeamBench';

import { CloneCommand } from './CloneCommand';

describe('CloneCommand', () => {
  const clone = new CloneCommand();

  it('clones an empty repository', () => {
    const team = new TeamBench();
    const result = team.online(team.bob, clone, { url: ORIGIN_URL });

    expect(result.output).toBe(
      "Cloning into 'project'...\nwarning: You appear to have cloned an empty repository.",
    );
    expect(result.explanation.key).toBe('clone.empty');
    expect(team.bob.repository.head).toEqual({ type: 'attached', branch: 'main' });
    expect(team.bob.repository.remotes).toEqual({ origin: { url: ORIGIN_URL } });
    expect(team.bob.repository.upstreams).toEqual({ main: { remote: 'origin', branch: 'main' } });
  });

  it('copies the history, the files and the remote branches', () => {
    const team = new TeamBench().share();
    const tip = team.alice.headCommit.hash;

    expect(team.bob.workspace.files).toEqual({ 'README.md': 'Hello\n' });
    expect(team.bob.headCommit.hash).toBe(tip);
    expect(team.bob.repository.remoteBranches).toEqual({ 'origin/main': tip });
    expect(team.bob.repository.index).toEqual(team.alice.headCommit.tree);
    expect(team.bob.workspace.identity.name).toBe('Bob');
  });

  it('explains the clone', () => {
    const team = new TeamBench().share();
    const other = new TeamBench();
    other.network = team.network;
    const result = other.online(other.bob, clone, { url: 'https://github.com/alice/project' });

    expect(result.output).toBe("Cloning into 'project'...");
    expect(result.explanation).toEqual({
      key: 'clone.cloned',
      params: {
        url: 'https://github.com/alice/project',
        branch: 'main',
        tracking: 'origin/main',
        commit: shortHash(team.alice.headCommit.hash),
        count: 1,
      },
    });
  });

  it('names the project folder after the repository or the given directory', () => {
    const team = new TeamBench();
    team.online(team.bob, clone, { url: ORIGIN_URL, directory: 'website' });
    expect(team.bob.workspace.path).toBe('/home/bob/website');

    const here = new TeamBench();
    const result = here.online(here.bob, clone, { url: ORIGIN_URL, directory: '.' });
    expect(result.output).toMatch(/^Cloning into '\.'\.\.\./);
    expect(here.bob.workspace.path).toBe('/home/bob/project');
  });

  it('refuses a workstation that already holds a project', () => {
    const team = new TeamBench().share();
    const result = team.online(team.alice, clone, { url: ORIGIN_URL });

    expect(result.output).toBe(
      "fatal: destination path 'project' already exists and is not an empty directory.",
    );
    expect(result.exitCode).toBe(128);
  });

  it('reports repositories that do not exist', () => {
    const team = new TeamBench();
    const result = team.online(team.bob, clone, { url: 'https://github.com/nobody/nothing.git' });

    expect(result.output).toBe(
      [
        'remote: Repository not found.',
        "fatal: repository 'https://github.com/nobody/nothing.git/' not found",
      ].join('\n'),
    );
    expect(team.bob.workspace.repository).toBeNull();
  });
});
