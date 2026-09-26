import { classifyOutputLines } from './classifyOutput';

describe('classifyOutputLines', () => {
  it('colors git status sections like Git', () => {
    const tones = classifyOutputLines(
      [
        'On branch main',
        'Changes to be committed:',
        '  (use "git restore --staged <file>..." to unstage)',
        '\tnew file:   a.txt',
        '',
        'Untracked files:',
        '\tb.txt',
      ].join('\n'),
    ).map((line) => line.tone);

    expect(tones).toEqual(['plain', 'plain', 'hint', 'staged', 'plain', 'plain', 'unstaged']);
  });

  it('flags errors, warnings and the current branch', () => {
    expect(
      classifyOutputLines(
        'fatal: bad\nwarning: careful\nls: command not found\n* main\n  feature',
      ).map((line) => line.tone),
    ).toEqual(['error', 'warning', 'error', 'current', 'plain']);
  });
});
