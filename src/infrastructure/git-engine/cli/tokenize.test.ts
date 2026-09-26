import { ShellSyntaxError, tokenize, tokenizeShell } from './tokenize';

describe('tokenize', () => {
  it.each([
    ['git status', ['git', 'status']],
    ['  git   add  .  ', ['git', 'add', '.']],
    ['git commit -m "feat: add login"', ['git', 'commit', '-m', 'feat: add login']],
    ["git commit -m 'it\"s fine'", ['git', 'commit', '-m', 'it"s fine']],
    ['git commit -m "say \\"hi\\""', ['git', 'commit', '-m', 'say "hi"']],
    ['git add my\\ file.txt', ['git', 'add', 'my file.txt']],
    ['git commit -m ""', ['git', 'commit', '-m', '']],
    ['git commit -m"feat: x"', ['git', 'commit', '-mfeat: x']],
    ['', []],
  ])('splits %j', (line, expected) => {
    expect(tokenize(line)).toEqual(expected);
  });

  it('keeps backslashes that do not escape anything inside double quotes', () => {
    expect(tokenize('echo "a\\nb"')).toEqual(['echo', 'a\\nb']);
  });

  it('rejects unterminated quotes', () => {
    expect(() => tokenize('git commit -m "oops')).toThrow(ShellSyntaxError);
  });
});

describe('tokenizeShell', () => {
  it('recognizes unquoted output redirections', () => {
    expect(tokenizeShell('echo hi>a.txt')).toEqual([
      { type: 'word', value: 'echo' },
      { type: 'word', value: 'hi' },
      { type: 'redirect', append: false },
      { type: 'word', value: 'a.txt' },
    ]);
    expect(tokenizeShell('echo "a > b" >> log')).toEqual([
      { type: 'word', value: 'echo' },
      { type: 'word', value: 'a > b' },
      { type: 'redirect', append: true },
      { type: 'word', value: 'log' },
    ]);
  });
});
