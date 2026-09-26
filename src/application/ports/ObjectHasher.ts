import type { Hash } from '@/domain/value-objects/Hash';

/** Computes the object id of a fully serialized Git object (header included). */
export interface ObjectHasher {
  hash(serializedObject: string): Hash;
}
