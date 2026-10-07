import { shortHash } from '@/domain/value-objects/Hash';
import { GitTestBench } from '@/test/fixtures/GitTestBench';
import { TeamBench } from '@/test/fixtures/TeamBench';

import { BranchCommand } from './BranchCommand';
import { CheckoutCommand } from './CheckoutCommand';
import { CommitCommand } from './CommitCommand';
import { FetchCommand } from './FetchCommand';
import { PushCommand } from './PushCommand';
import { TagCommand } from './TagCommand';

const FROM = 'From https://github.com/alice/project';

describe('FetchCommand', () => {
  const fetch = new FetchCommand();
  const push = new PushCommand();

  it('does nothing without any remote', () => {
    const team = new TeamBench();
    const bench = new GitTestBench(team.context).init();
    const result = team.online(bench, fetch, {});

    expect(result.output).toBe('');
    expect(result.exitCode).toBe(0);
    expect(result.explanation.key).toBe('fetch.noRemote');
  });

  it('downloads new commits and moves the remote-tracking branch only', () => {
    const team = new TeamBench().share();
    const before = team.alice.headCommit.hash;
    team.bob.commit('docs: describe the project', { 'README.md': 'Hello, Bob\n' });
    team.online(team.bob, push, {});
    const after = team.bob.headCommit.hash;

    const result = team.online(team.alice, fetch, {});

    expect(result.output).toBe(
      [FROM, `   ${shortHash(before)}..${shortHash(after)}  main       -> origin/main`].join('\n'),
    );
    expect(team.alice.repository.remoteBranches['origin/main']).toBe(after);
    expect(team.alice.headCommit.hash).toBe(before);
    expect(team.alice.workspace.files['README.md']).toBe('Hello\n');
    expect(result.explanation).toEqual({
      key: 'fetch.updated',
      params: { remote: 'origin', count: 1 },
    });
  });

  it('reports new branches and tags, then nothing once up to date', () => {
    const team = new TeamBench().share();
    team.bob.run(new CheckoutCommand(team.context), { targets: [], newBranch: 'feature/login' });
    team.bob.commit('feat: add login', { 'login.ts': 'login\n' });
    team.bob.run(new TagCommand(team.context), { action: 'create', name: 'v1.0.0' });
    team.online(team.bob, push, { remote: 'origin', refspecs: ['feature/login'], tags: true });

    expect(team.online(team.alice, fetch, {}).output).toBe(
      [
        FROM,
        ' * [new branch]      feature/login -> origin/feature/login',
        ' * [new tag]         v1.0.0        -> v1.0.0',
      ].join('\n'),
    );
    expect(team.alice.repository.tags['v1.0.0']).toBeDefined();

    const again = team.online(team.alice, fetch, {});
    expect(again.output).toBe('');
    expect(again.explanation.key).toBe('fetch.upToDate');
  });

  it('shows forced updates after history was rewritten on the remote', () => {
    const team = new TeamBench().share();
    team.bob.commit('feat: first try', { 'a.txt': 'a\n' });
    team.online(team.bob, push, {});
    team.online(team.alice, fetch, {});
    const first = team.bob.headCommit.hash;
    team.bob.run(new CommitCommand(team.context), { messages: ['feat: better try'], amend: true });
    team.online(team.bob, push, { force: true });
    const second = team.bob.headCommit.hash;

    expect(team.online(team.alice, fetch, {}).output).toBe(
      [
        FROM,
        ` + ${shortHash(first)}...${shortHash(second)} main       -> origin/main  (forced update)`,
      ].join('\n'),
    );
  });

  it('prunes remote-tracking branches deleted on the remote', () => {
    const team = new TeamBench().share();
    team.alice.run(new BranchCommand(), { action: 'create', name: 'old' });
    team.online(team.alice, push, { remote: 'origin', refspecs: ['old'] });
    team.online(team.bob, fetch, {});
    team.online(team.alice, push, { remote: 'origin', refspecs: ['old'], delete: true });

    expect(team.online(team.bob, fetch, {}).output).toBe('');
    expect(team.bob.repository.remoteBranches['origin/old']).toBeDefined();
    expect(team.online(team.bob, fetch, { prune: true }).output).toBe(
      [FROM, ' - [deleted]         (none)     -> origin/old'].join('\n'),
    );
    expect(team.bob.repository.remoteBranches['origin/old']).toBeUndefined();
  });

  it('fetches only the requested branches', () => {
    const team = new TeamBench().share();
    team.alice.run(new BranchCommand(), { action: 'create', name: 'other' });
    team.online(team.alice, push, { remote: 'origin', refspecs: ['other'] });

    team.online(team.bob, fetch, { remote: 'origin', branches: ['main'] });
    expect(team.bob.repository.remoteBranches['origin/other']).toBeUndefined();

    const missing = team.online(team.bob, fetch, { remote: 'origin', branches: ['nope'] });
    expect(missing.output).toBe("fatal: couldn't find remote ref nope");
  });

  it('reports unknown remotes', () => {
    const team = new TeamBench().share();
    const result = team.online(team.bob, fetch, { remote: 'upstream' });

    expect(result.output).toMatch(/^fatal: 'upstream' does not appear to be a git repository\n/);
    expect(result.exitCode).toBe(128);
  });

  it('fetches every remote with --all', () => {
    const team = new TeamBench().share();
    expect(team.online(team.bob, fetch, { all: true }).output).toBe('Fetching origin');
  });
});
