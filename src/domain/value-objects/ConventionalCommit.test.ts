import { HEADER_MAX_LENGTH, isConventionalHeader, isGeneratedHeader } from './ConventionalCommit';

describe('isConventionalHeader', () => {
  it.each([
    'feat: add arrays',
    'fix(parser): handle empty input',
    'refactor(ui/graph): extract the layout',
    'feat!: drop node 18',
    'chore(deps)!: upgrade react',
  ])('accepts `%s`', (header) => {
    expect(isConventionalHeader(header)).toBe(true);
  });

  it.each([
    'Added stuff',
    'feature: add arrays',
    'feat:add arrays',
    'feat: ',
    'feat(): add arrays',
    'Feat: add arrays',
  ])('rejects `%s`', (header) => {
    expect(isConventionalHeader(header)).toBe(false);
  });

  it('rejects a header longer than the commitlint limit', () => {
    const header = `feat: ${'a'.repeat(HEADER_MAX_LENGTH)}`;

    expect(isConventionalHeader(header)).toBe(false);
    expect(isConventionalHeader(header.slice(0, HEADER_MAX_LENGTH))).toBe(true);
  });
});

describe('isGeneratedHeader', () => {
  it.each([
    "Merge branch 'feature' into main",
    'Merge pull request #1 from bob/docs',
    'Revert "feat: add arrays"',
  ])('recognizes `%s` as written by Git', (header) => {
    expect(isGeneratedHeader(header)).toBe(true);
  });

  it('does not mistake a conventional revert for a generated one', () => {
    expect(isGeneratedHeader('revert: drop arrays')).toBe(false);
  });
});
