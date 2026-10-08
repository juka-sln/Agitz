import { buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import { NoUpstreamForBranchError } from '../errors/RemoteErrors';
import { AmbiguousRevisionError, UnknownRevisionError } from '../errors/RepositoryErrors';
import type { BranchName } from '../value-objects/BranchName';
import { toHash } from '../value-objects/Hash';

import { resolveRevision, tryResolveRevision } from './revision';

const A = fakeHash('a1');
const B = fakeHash('b2');
const C = fakeHash('c3');
const D = fakeHash('d4');
const M = toHash(`a19${'0'.repeat(37)}`);

const repository = buildRepository(
  [
    { hash: A },
    { hash: B, parents: [A] },
    { hash: C, parents: [B] },
    { hash: D, parents: [A] },
    { hash: M, parents: [C, D] },
  ],
  { main: M, feature: D },
);

describe('resolveRevision', () => {
  it.each([
    ['HEAD', M],
    ['@', M],
    ['main', M],
    ['feature', D],
    ['HEAD~1', C],
    ['HEAD~3', A],
    ['HEAD^', C],
    ['HEAD^2', D],
    ['HEAD^0', M],
    ['main~2^', A],
    ['b2b2', B],
    [C, C],
  ])('resolves %s', (revision, expected) => {
    expect(resolveRevision(repository, revision)).toBe(expected);
  });

  it('fails on unknown revisions and missing parents', () => {
    expect(() => resolveRevision(repository, 'nope')).toThrow(UnknownRevisionError);
    expect(() => resolveRevision(repository, 'HEAD~10')).toThrow(UnknownRevisionError);
    expect(() => resolveRevision(repository, 'HEAD^3')).toThrow(UnknownRevisionError);
  });

  it('fails on ambiguous short hashes', () => {
    expect(() => resolveRevision(repository, 'a1a1')).not.toThrow();
    expect(() => resolveRevision(repository, 'a1')).toThrow(UnknownRevisionError);
    const ambiguous = buildRepository([{ hash: A }, { hash: toHash(`a1a1${'f'.repeat(36)}`) }], {
      main: A,
    });
    expect(() => resolveRevision(ambiguous, 'a1a1')).toThrow(AmbiguousRevisionError);
  });

  it('cannot resolve HEAD on an unborn branch', () => {
    const empty = buildRepository([], {});
    expect(tryResolveRevision(empty, 'HEAD')).toBeNull();
  });

  it('resolves tags before branches', () => {
    const tagged = {
      ...repository,
      tags: { v1: { target: B, annotation: null }, feature: { target: C, annotation: null } },
    };

    expect(resolveRevision(tagged, 'v1~1')).toBe(A);
    expect(resolveRevision(tagged, 'feature')).toBe(C);
  });

  describe('with remote-tracking branches', () => {
    const tracked = {
      ...repository,
      remoteBranches: { 'origin/main': C, 'origin/feature': D },
      upstreams: { main: { remote: 'origin', branch: 'main' as BranchName } },
    };

    it.each([
      ['origin/main', C],
      ['origin/main~1', B],
      ['remotes/origin/feature', D],
      ['refs/remotes/origin/main', C],
      ['refs/heads/main', M],
      ['@{u}', C],
      ['@{upstream}~2', A],
      ['main@{u}', C],
    ])('resolves %s', (revision, expected) => {
      expect(resolveRevision(tracked, revision)).toBe(expected);
    });

    it('prefers local branches over remote-tracking ones', () => {
      const shadowed = { ...tracked, branches: { ...tracked.branches, 'origin/main': A } };
      expect(resolveRevision(shadowed, 'origin/main')).toBe(A);
      expect(resolveRevision(shadowed, 'refs/remotes/origin/main')).toBe(C);
    });

    it('requires an upstream for @{u}', () => {
      expect(() => resolveRevision(tracked, 'feature@{u}')).toThrow(NoUpstreamForBranchError);
      expect(tryResolveRevision(tracked, 'refs/heads/origin/main')).toBeNull();
    });
  });
});
