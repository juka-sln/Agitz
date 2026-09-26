import type { Hash } from '../value-objects/Hash';

/**
 * A path Git could not merge automatically: the three versions involved,
 * like the index stages 1 (base), 2 (ours) and 3 (theirs). `null` means absent.
 */
export interface UnmergedEntry {
  readonly base: Hash | null;
  readonly ours: Hash | null;
  readonly theirs: Hash | null;
}

export type UnmergedType =
  | 'both modified'
  | 'both added'
  | 'deleted by us'
  | 'deleted by them'
  | 'added by us'
  | 'added by them';

export function classifyUnmerged(entry: UnmergedEntry): UnmergedType {
  const { base, ours, theirs } = entry;
  if (ours !== null && theirs !== null) {
    return base === null ? 'both added' : 'both modified';
  }
  if (base === null) {
    return ours === null ? 'added by them' : 'added by us';
  }
  return ours === null ? 'deleted by us' : 'deleted by them';
}
