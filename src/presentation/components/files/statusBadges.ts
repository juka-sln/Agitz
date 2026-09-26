import type { WorkingTreeEntry } from '@/application/queries/getWorkingTreeEntries';

import type { MessageKey } from '../../i18n/messages';

export type BadgeTone = 'staged' | 'modified' | 'untracked' | 'deleted' | 'conflict';

export interface StatusBadge {
  readonly letter: string;
  readonly tone: BadgeTone;
  readonly label: MessageKey;
}

/** The letters of `git status --short`: first what is staged, then what only exists on disk. */
export function statusBadges(entry: WorkingTreeEntry): StatusBadge[] {
  if (entry.conflict !== null) {
    return [{ letter: 'C', tone: 'conflict', label: 'files.status.conflict' }];
  }
  const badges: StatusBadge[] = [];
  if (entry.staged === 'added') {
    badges.push({ letter: 'A', tone: 'staged', label: 'files.status.stagedAdded' });
  } else if (entry.staged === 'modified') {
    badges.push({ letter: 'M', tone: 'staged', label: 'files.status.stagedModified' });
  } else if (entry.staged === 'deleted') {
    badges.push({ letter: 'D', tone: 'staged', label: 'files.status.stagedDeleted' });
  }

  if (entry.unstaged === 'untracked') {
    badges.push({ letter: 'U', tone: 'untracked', label: 'files.status.untracked' });
  } else if (entry.unstaged === 'modified') {
    badges.push({ letter: 'M', tone: 'modified', label: 'files.status.modified' });
  } else if (entry.unstaged === 'deleted') {
    badges.push({ letter: 'D', tone: 'deleted', label: 'files.status.deleted' });
  }
  return badges;
}

export function isGoneFromDisk(entry: WorkingTreeEntry): boolean {
  return entry.unstaged === 'deleted' || (entry.staged === 'deleted' && entry.unstaged === null);
}
