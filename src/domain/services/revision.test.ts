import { buildRepository, fakeHash } from '@/test/fixtures/repositoryFixtures';

import { AmbiguousRevisionError, UnknownRevisionError } from '../errors/RepositoryErrors';
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
});
