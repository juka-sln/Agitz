import { getCommit, getHeadCommitHash, type Repository } from '@/domain/entities/Repository';
import type { UnmergedType } from '@/domain/entities/UnmergedEntry';
import type { WorkingTreeStatus } from '@/domain/services/status';
import type { FileChange, FileChangeType } from '@/domain/value-objects/FileChange';
import { compareByteOrder, parentDirectories } from '@/domain/value-objects/FilePath';
import { shortHash, type Hash } from '@/domain/value-objects/Hash';

import { describeCommit, pluralize } from './describeCommit';
import { formatTrackingStatus } from './remotes';

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

const UNMERGED_SHORT_CODES: Record<UnmergedType, string> = {
  'both modified': 'UU',
  'both added': 'AA',
  'deleted by us': 'DU',
  'deleted by them': 'UD',
  'added by us': 'AU',
  'added by them': 'UA',
};

export function describeHead(repository: Repository): string {
  const { head, operation } = repository;
  if (operation?.type === 'rebase' && operation.onto !== null) {
    return `interactive rebase in progress; onto ${shortHash(operation.onto)}`;
  }
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
  if (status.unstaged.length > 0 || status.unmerged.length > 0) {
    return 'no changes added to commit (use "git add" and/or "git commit -a")';
  }
  if (status.untracked.length > 0) {
    return 'nothing added to commit but untracked files present (use "git add" to track)';
  }
  return getHeadCommitHash(repository) === null
    ? 'nothing to commit (create/copy files and use "git add" to track)'
    : 'nothing to commit, working tree clean';
}

const pick = (repository: Repository, hash: Hash) =>
  `   pick ${describeCommit(getCommit(repository, hash))}`;

/** The block Git prints while a merge, cherry-pick, revert or rebase waits for the user. */
function describeOperation(repository: Repository, status: WorkingTreeStatus): string[] {
  const { operation } = repository;
  if (!operation) {
    return [];
  }
  const hasConflicts = status.unmerged.length > 0;

  if (operation.type === 'merge') {
    return hasConflicts
      ? [
          'You have unmerged paths.',
          '  (fix conflicts and run "git commit")',
          '  (use "git merge --abort" to abort the merge)',
          '',
        ]
      : [
          'All conflicts fixed but you are still merging.',
          '  (use "git commit" to conclude merge)',
          '',
        ];
  }

  const command = operation.type;
  const resume = hasConflicts
    ? `  (fix conflicts and ${command === 'rebase' ? 'then ' : ''}run "git ${command} --continue")`
    : `  (all conflicts fixed: run "git ${command} --continue")`;

  if (command === 'rebase') {
    const done = operation.total - operation.todo.length;
    const remaining = operation.todo.length;
    return [
      `Last command done (${pluralize(done, 'command')} done):`,
      pick(repository, operation.current),
      ...(remaining === 0
        ? ['No commands remaining.']
        : [
            `Next ${remaining === 1 ? 'command' : 'commands'} to do (${pluralize(remaining, 'remaining command')}):`,
            ...operation.todo.slice(0, 2).map((hash) => pick(repository, hash)),
            '  (use "git rebase --edit-todo" to view and edit)',
          ]),
      `You are currently rebasing branch '${operation.branch ?? 'HEAD'}' on '${shortHash(operation.onto ?? operation.origHead)}'.`,
      resume,
      '  (use "git rebase --skip" to skip this patch)',
      '  (use "git rebase --abort" to check out the original branch)',
      '',
    ];
  }

  const verb = command === 'revert' ? 'reverting' : 'cherry-picking';
  return [
    `You are currently ${verb} commit ${shortHash(operation.current)}.`,
    resume,
    `  (use "git ${command} --skip" to skip this patch)`,
    `  (use "git ${command} --abort" to cancel the ${command} operation)`,
    '',
  ];
}

function describeUnmerged(repository: Repository, status: WorkingTreeStatus): string[] {
  if (status.unmerged.length === 0) {
    return [];
  }
  const hasDeletion = status.unmerged.some(({ type }) => type.startsWith('deleted'));
  return [
    'Unmerged paths:',
    ...(repository.operation && repository.operation.type !== 'merge'
      ? ['  (use "git restore --staged <file>..." to unstage)']
      : []),
    hasDeletion
      ? '  (use "git add/rm <file>..." as appropriate to mark resolution)'
      : '  (use "git add <file>..." to mark resolution)',
    ...status.unmerged.map(({ path, type }) => `\t${`${type}:`.padEnd(17)}${path}`),
    '',
  ];
}

function describeTracking(repository: Repository): string[] {
  const { head, operation } = repository;
  if (head.type !== 'attached' || operation?.type === 'rebase') {
    return [];
  }
  const tracking = formatTrackingStatus(repository, head.branch);
  return tracking.length === 0 ? [] : [...tracking, ''];
}

export function formatLongStatus(repository: Repository, status: WorkingTreeStatus): string {
  const isUnborn = getHeadCommitHash(repository) === null;
  const lines = [describeHead(repository), ...describeTracking(repository)];
  lines.push(...describeOperation(repository, status));

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
  lines.push(...describeUnmerged(repository, status));
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

  const rows: (readonly [path: string, code: string])[] = [
    ...[...codes.entries()].map(
      ([path, [index, workingTree]]) => [path, `${index}${workingTree}`] as const,
    ),
    ...status.unmerged.map(({ path, type }) => [path, UNMERGED_SHORT_CODES[type]] as const),
  ];
  const tracked = rows
    .sort(([left], [right]) => compareByteOrder(left, right))
    .map(([path, code]) => `${code} ${path}`);
  const untracked = collapseUntrackedPaths(repository, status.untracked).map(
    (path) => `?? ${path}`,
  );
  return [...tracked, ...untracked].join('\n');
}

/** The `M\tfile` lines Git prints after switching branches with local changes. */
export function formatLocalChanges(status: WorkingTreeStatus): string[] {
  const codes = new Map<string, string>(status.unmerged.map(({ path }) => [path, 'U']));
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
