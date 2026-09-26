import { compareByteOrder } from '../value-objects/FilePath';
import type { Hash } from '../value-objects/Hash';

/** Flat snapshot of tracked files: normalized path mapped to the hash of its blob. */
export type Tree = Readonly<Record<string, Hash>>;

export const EMPTY_TREE: Tree = {};

export function treePaths(tree: Tree): string[] {
  return Object.keys(tree).sort(compareByteOrder);
}

export function treesAreEqual(left: Tree, right: Tree): boolean {
  const leftPaths = Object.keys(left);
  if (leftPaths.length !== Object.keys(right).length) {
    return false;
  }
  return leftPaths.every((path) => left[path] === right[path]);
}
