import { EmptyCommitMessageError } from '../errors/CommitErrors';

import { commitSubject, createCommitMessage } from './CommitMessage';

describe('CommitMessage', () => {
  it('strips surrounding blank lines and trailing spaces', () => {
    expect(createCommitMessage('\n\nfeat: add login   \n\n')).toBe('feat: add login');
  });

  it('collapses consecutive blank lines in the body', () => {
    expect(createCommitMessage('fix: typo\n\n\n\nExplain why.')).toBe('fix: typo\n\nExplain why.');
  });

  it('rejects a message made only of whitespace', () => {
    expect(() => createCommitMessage('  \n \n')).toThrow(EmptyCommitMessageError);
  });

  it('extracts the subject line', () => {
    expect(commitSubject(createCommitMessage('feat: add login\n\nBody'))).toBe('feat: add login');
  });
});
