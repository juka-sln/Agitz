import type { BranchName } from '@/domain/value-objects/BranchName';
import { GitTestBench } from '@/test/fixtures/GitTestBench';
import { fakeHash } from '@/test/fixtures/repositoryFixtures';

import { RemoteCommand } from './RemoteCommand';

const URL = 'https://github.com/alice/project.git';

describe('RemoteCommand', () => {
  const remote = new RemoteCommand();

  function benchWithOrigin() {
    const bench = new GitTestBench().init();
    bench.run(remote, { action: 'add', name: 'origin', url: URL });
    return bench;
  }

  it('adds a remote and lists it', () => {
    const bench = benchWithOrigin();

    expect(bench.repository.remotes).toEqual({ origin: { url: URL } });
    expect(bench.run(remote, { action: 'list' }).output).toBe('origin');
    expect(bench.run(remote, { action: 'list', verbose: true }).output).toBe(
      `origin\t${URL} (fetch)\norigin\t${URL} (push)`,
    );
    expect(bench.run(remote, { action: 'get-url', name: 'origin' }).output).toBe(URL);
  });

  it('explains when there is no remote yet', () => {
    const result = new GitTestBench().init().run(remote, { action: 'list' });

    expect(result.output).toBe('');
    expect(result.explanation.key).toBe('remote.none');
  });

  it('refuses duplicate and invalid names', () => {
    const bench = benchWithOrigin();

    const duplicate = bench.run(remote, { action: 'add', name: 'origin', url: 'x' });
    expect(duplicate.output).toBe('error: remote origin already exists.');
    expect(duplicate.exitCode).toBe(3);
    expect(bench.run(remote, { action: 'add', name: 'my remote', url: 'x' }).output).toBe(
      "fatal: 'my remote' is not a valid remote name",
    );
  });

  it('removes a remote with its remote-tracking branches and upstreams', () => {
    const bench = benchWithOrigin();
    bench.workspace = {
      ...bench.workspace,
      repository: {
        ...bench.repository,
        remoteBranches: { 'origin/main': fakeHash('a'), 'originals/main': fakeHash('b') },
        upstreams: { main: { remote: 'origin', branch: 'main' as BranchName } },
      },
    };

    bench.run(remote, { action: 'remove', name: 'origin' });

    expect(bench.repository.remotes).toEqual({});
    expect(bench.repository.remoteBranches).toEqual({ 'originals/main': fakeHash('b') });
    expect(bench.repository.upstreams).toEqual({});
  });

  it('renames a remote and everything that refers to it', () => {
    const bench = benchWithOrigin();
    bench.workspace = {
      ...bench.workspace,
      repository: {
        ...bench.repository,
        remoteBranches: { 'origin/main': fakeHash('a') },
        upstreams: { main: { remote: 'origin', branch: 'main' as BranchName } },
      },
    };

    bench.run(remote, { action: 'rename', oldName: 'origin', newName: 'upstream' });

    expect(bench.repository.remotes).toEqual({ upstream: { url: URL } });
    expect(bench.repository.remoteBranches).toEqual({ 'upstream/main': fakeHash('a') });
    expect(bench.repository.upstreams).toEqual({ main: { remote: 'upstream', branch: 'main' } });
  });

  it('changes the URL of a remote', () => {
    const bench = benchWithOrigin();
    bench.run(remote, { action: 'set-url', name: 'origin', url: 'https://github.com/bob/x.git' });

    expect(bench.repository.remotes.origin?.url).toBe('https://github.com/bob/x.git');
  });

  it.each([
    { action: 'remove', name: 'nope' },
    { action: 'rename', oldName: 'nope', newName: 'other' },
    { action: 'get-url', name: 'nope' },
    { action: 'set-url', name: 'nope', url: URL },
  ] as const)('reports unknown remotes ($action)', (input) => {
    const result = benchWithOrigin().run(remote, input);

    expect(result.output).toBe("error: No such remote: 'nope'");
    expect(result.exitCode).toBe(2);
  });
});
