import { EmptyCommitMessageError } from '../errors/CommitErrors';

export type CommitMessage = string & { readonly __brand: 'CommitMessage' };

/**
 * Mirrors Git's default "whitespace" cleanup for messages given with `-m`:
 * trailing spaces are removed, consecutive blank lines are collapsed and
 * leading/trailing blank lines are stripped.
 */
export function createCommitMessage(raw: string): CommitMessage {
  const lines = raw.split('\n').map((line) => line.trimEnd());
  const collapsed = lines.filter((line, index) => line !== '' || lines[index - 1] !== '');
  const message = collapsed.join('\n').trim();

  if (message === '') {
    throw new EmptyCommitMessageError();
  }
  return message as CommitMessage;
}

export function commitSubject(message: CommitMessage): string {
  return message.split('\n', 1)[0] ?? '';
}
