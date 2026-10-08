import type { ObjectHasher } from '@/application/ports/ObjectHasher';
import { toHash, type Hash } from '@/domain/value-objects/Hash';

import { sha1 } from './sha1';

const encoder = new TextEncoder();

/** Produces the same object ids as Git for blobs (`git hash-object`). */
export class Sha1ObjectHasher implements ObjectHasher {
  hash(serializedObject: string): Hash {
    return toHash(sha1(encoder.encode(serializedObject)));
  }
}
