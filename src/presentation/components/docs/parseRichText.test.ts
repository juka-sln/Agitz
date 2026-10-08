import { parseRichText } from './parseRichText';

describe('parseRichText', () => {
  it('finds code and emphasis', () => {
    expect(parseRichText('Run `git add` **before** committing.')).toEqual([
      { kind: 'text', text: 'Run ' },
      { kind: 'code', text: 'git add' },
      { kind: 'text', text: ' ' },
      { kind: 'strong', text: 'before' },
      { kind: 'text', text: ' committing.' },
    ]);
  });

  it('keeps stars inside code literal', () => {
    expect(parseRichText('Ignore `*.log` files')).toEqual([
      { kind: 'text', text: 'Ignore ' },
      { kind: 'code', text: '*.log' },
      { kind: 'text', text: ' files' },
    ]);
  });

  it('returns plain text untouched', () => {
    expect(parseRichText('Nothing special')).toEqual([{ kind: 'text', text: 'Nothing special' }]);
  });
});
