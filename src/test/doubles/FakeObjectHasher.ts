import type { ObjectHasher } from '@/application/ports/ObjectHasher';
import { toHash, type Hash } from '@/domain/value-objects/Hash';

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(content: string, seed: number): string {
  let hash = (FNV_OFFSET ^ seed) >>> 0;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Deterministic, fast stand-in for SHA-1: five seeded FNV-1a hashes give 40 hex characters. */
export function fakeContentHash(content: string): Hash {
  return toHash([1, 2, 3, 4, 5].map((seed) => fnv1a(content, seed)).join(''));
}

export class FakeObjectHasher implements ObjectHasher {
  hash(content: string): Hash {
    return fakeContentHash(content);
  }
}
