import { sha1 } from './sha1';

const encode = (text: string) => new TextEncoder().encode(text);

describe('sha1', () => {
  it.each([
    ['', 'da39a3ee5e6b4b0d3255bfef95601890afd80709'],
    ['abc', 'a9993e364706816aba3e25717850c26c9cd0d89d'],
    ['The quick brown fox jumps over the lazy dog', '2fd4e1c67a2d28fced849ee1bb76e7391b93eb12'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '84983e441c3bd26ebaae4aa1f95129e5e54670f1',
    ],
  ])('hashes %j', (input, expected) => {
    expect(sha1(encode(input))).toBe(expected);
  });

  it('handles inputs spanning many blocks', () => {
    expect(sha1(encode('a'.repeat(1_000_000)))).toBe('34aa973cd4c4daa4f61eeb2bdbad27316534016f');
  });
});
