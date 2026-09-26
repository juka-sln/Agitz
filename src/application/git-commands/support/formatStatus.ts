import { getHeadCommitHash, type Repository } from '@/domain/entities/Repository';
import type { WorkingTreeStatus } from '@/domain/services/status';
import type { FileChange, FileChangeType } from '@/domain/value-objects/FileChange';
import { compareByteOrder, parentDirectories } from '@/domain/value-objects/FilePath';
import { shortHash } from '@/domain/value-objects/Hash';

const LONG_LABELS: Record<FileChangeType, string> = {
  added: 'new file:',
  modified: 'modified:',
  deleted: 'deleted:',
};

const SHORT_CODES: Record<FileChangeType, string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
};

export function describeHead(repository: Repository): string {
  const { head } = repository;
  return head.type === 'attached'
    ? `On branch ${head.branch}`
    : `HEAD detached at ${shortHash(head.commit)}`;
}

/**
 * Like Git, shows a directory with no tracked content as a single `dir/` entry
 * instead of listing every untracked file inside it.
 */
export function collapseUntrackedPaths(repository: Repository, untracked: readonly string[]) {
  const trackedDirectories = new Set(Object.keys(repository.index).flatMap(parentDirectories));
  const entries = untracked.map((path) => {
    const untrackedDirectory = parentDirectories(path).find(
      (directory) => !trackedDirectories.has(directory),
    );
    return untrackedDirectory === undefined ? path : `${untrackedDirectory}/`;
  });
  return [...new Set(entries)].sort(compareByteOrder);
}

const formatLongChange = (change: FileChange) =>
  `\t${LONG_LABELS[change.type].padEnd(12)}${change.path}`;

function summaryLine(repository: Repository, status: WorkingTreeStatus): string | null {
  if (status.staged.length > 0) {
    return null;
  }
  if (status.unstaged.length > 0) {
    return 'no changes added to commit (use "git add" and/or "git commit -a")';
  }
  if (status.untracked.length > 0) {
    return 'nothing added to commit but untracked files present (use "git add" to track)';
  }
  return getHeadCommitHash(repository) === null
    ? 'nothing to commit (create/copy files and use "git add" to track)'
    : 'nothing to commit, working tree clean';
}

export function formatLongStatus(repository: Repository, status: WorkingTreeStatus): string {
  const isUnborn = getHeadCommitHash(repository) === null;
  const lines = [describeHead(repository)];

  if (isUnborn) {
    lines.push('', 'No commits yet', '');
  }
  if (status.staged.length > 0) {
    lines.push(
      'Changes to be committed:',
      isUnborn
        ? '  (use "git rm --cached <file>..." to unstage)'
        : '  (use "git restore --staged <file>..." to unstage)',
      ...status.staged.map(formatLongChange),
      '',
    );
  }
  if (status.unstaged.length > 0) {
    const hasDeletion = status.unstaged.some((change) => change.type === 'deleted');
    lines.push(
      'Changes not staged for commit:',
      hasDeletion
        ? '  (use "git add/rm <file>..." to update what will be committed)'
        : '  (use "git add <file>..." to update what will be committed)',
      '  (use "git restore <file>..." to discard changes in working directory)',
      ...status.unstaged.map(formatLongChange),
      '',
    );
  }
  if (status.untracked.length > 0) {
    lines.push(
      'Untracked files:',
      '  (use "git add <file>..." to include in what will be committed)',
      ...collapseUntrackedPaths(repository, status.untracked).map((path) => `\t${path}`),
      '',
    );
  }

  const summary = summaryLine(repository, status);
  if (summary !== null) {
    lines.push(summary);
  }
  return lines.join('\n').trimEnd();
}

export function formatShortStatus(repository: Repository, status: WorkingTreeStatus): string {
  const codes = new Map<string, [string, string]>();
  status.staged.forEach(({ path, type }) => codes.set(path, [SHORT_CODES[type], ' ']));
  status.unstaged.forEach(({ path, type }) => {
    codes.set(path, [codes.get(path)?.[0] ?? ' ', SHORT_CODES[type]]);
  });

  const tracked = [...codes.entries()]
    .sort(([left], [right]) => compareByteOrder(left, right))
    .map(([path, [index, workingTree]]) => `${index}${workingTree} ${path}`);
  const untracked = collapseUntrackedPaths(repository, status.untracked).map(
    (path) => `?? ${path}`,
  );
  return [...tracked, ...untracked].join('\n');
}

/** The `M\tfile` lines Git prints after switching branches with local changes. */
export function formatLocalChanges(status: WorkingTreeStatus): string[] {
  const codes = new Map<string, string>();
  status.staged.forEach(({ path, type }) => codes.set(path, SHORT_CODES[type]));
  status.unstaged.forEach(({ path, type }) => {
    if (type === 'deleted' || !codes.has(path)) {
      codes.set(path, SHORT_CODES[type]);
    }
  });
  return [...codes.entries()]
    .sort(([left], [right]) => compareByteOrder(left, right))
    .map(([path, code]) => `${code}\t${path}`);
}
