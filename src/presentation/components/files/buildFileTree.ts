import type { WorkingTreeEntry } from '@/application/queries/getWorkingTreeEntries';

export type FileTreeRow =
  | {
      readonly kind: 'directory';
      readonly key: string;
      readonly name: string;
      readonly depth: number;
    }
  | {
      readonly kind: 'file';
      readonly key: string;
      readonly name: string;
      readonly depth: number;
      readonly entry: WorkingTreeEntry;
    };

/** Flattens sorted paths into indented rows, emitting each directory once before its content. */
export function buildFileTree(entries: readonly WorkingTreeEntry[]): FileTreeRow[] {
  const rows: FileTreeRow[] = [];
  const seenDirectories = new Set<string>();

  for (const entry of entries) {
    const parts = entry.path.split('/');
    parts.slice(0, -1).forEach((name, depth) => {
      const directory = parts.slice(0, depth + 1).join('/');
      if (!seenDirectories.has(directory)) {
        seenDirectories.add(directory);
        rows.push({ kind: 'directory', key: `${directory}/`, name, depth });
      }
    });
    rows.push({
      kind: 'file',
      key: entry.path,
      name: parts.at(-1) ?? entry.path,
      depth: parts.length - 1,
      entry,
    });
  }
  return rows;
}
