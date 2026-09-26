import type { Commit } from '@/domain/entities/Commit';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { shortHash } from '@/domain/value-objects/Hash';

/** `a1b2c3d feat: add login`, as used in many Git messages. */
export function describeCommit(commit: Commit): string {
  return `${shortHash(commit.hash)} ${commitSubject(commit.message)}`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
