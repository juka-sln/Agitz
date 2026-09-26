import type { Repository } from '@/domain/entities/Repository';
import type { Tree } from '@/domain/entities/Tree';
import { countLineChanges } from '@/domain/services/lineDiff';
import { diffTrees } from '@/domain/services/treeDiff';

import { pluralize } from './describeCommit';
import { blobContentOrEmpty } from './objects';

const MAX_BAR_WIDTH = 50;

/**
 * Git's diffstat: optionally one ` path | 3 ++-` line per file, then the summary
 * (` 2 files changed, 3 insertions(+), 1 deletion(-)`) and create/delete mode lines.
 */
export function formatDiffStat(
  repository: Repository,
  from: Tree,
  to: Tree,
  { perFile }: { perFile: boolean },
): string[] {
  const changes = diffTrees(from, to).map((change) => ({
    ...change,
    ...countLineChanges(
      blobContentOrEmpty(repository, change.before),
      blobContentOrEmpty(repository, change.after),
    ),
  }));
  if (changes.length === 0) {
    return [];
  }

  const insertions = changes.reduce((sum, change) => sum + change.insertions, 0);
  const deletions = changes.reduce((sum, change) => sum + change.deletions, 0);

  const fileLines: string[] = [];
  if (perFile) {
    const pathWidth = Math.max(...changes.map((change) => change.path.length));
    const largest = Math.max(...changes.map((change) => change.insertions + change.deletions));
    const countWidth = String(largest).length;
    const scale = largest > MAX_BAR_WIDTH ? MAX_BAR_WIDTH / largest : 1;
    for (const change of changes) {
      const total = change.insertions + change.deletions;
      const bar = `${'+'.repeat(Math.round(change.insertions * scale))}${'-'.repeat(Math.round(change.deletions * scale))}`;
      fileLines.push(
        ` ${change.path.padEnd(pathWidth)} | ${String(total).padStart(countWidth)} ${bar}`.trimEnd(),
      );
    }
  }

  let summary = ` ${pluralize(changes.length, 'file')} changed`;
  if (insertions > 0 || deletions === 0) {
    summary += `, ${pluralize(insertions, 'insertion')}(+)`;
  }
  if (deletions > 0 || insertions === 0) {
    summary += `, ${pluralize(deletions, 'deletion')}(-)`;
  }

  const modes = changes.flatMap((change) => {
    if (change.type === 'added') {
      return [` create mode 100644 ${change.path}`];
    }
    return change.type === 'deleted' ? [` delete mode 100644 ${change.path}`] : [];
  });
  return [...fileLines, summary, ...modes];
}
