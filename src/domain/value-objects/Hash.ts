export type Hash = string & { readonly __brand: 'Hash' };

export const SHORT_HASH_LENGTH = 7;

const FULL_HASH_PATTERN = /^[0-9a-f]{40}$/;

export function isHash(value: string): value is Hash {
  return FULL_HASH_PATTERN.test(value);
}

export function toHash(value: string): Hash {
  if (!isHash(value)) {
    throw new Error(`Invalid object hash: ${value}`);
  }
  return value;
}

export function shortHash(hash: Hash): string {
  return hash.slice(0, SHORT_HASH_LENGTH);
}
