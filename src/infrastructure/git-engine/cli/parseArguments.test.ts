import { UsageError } from './CommandLineErrors';
import {
  hasOption,
  lastOptionValue,
  optionValues,
  parseArguments,
  type OptionSpec,
} from './parseArguments';

const specs: OptionSpec[] = [
  { name: 'all', short: 'a', long: 'all' },
  { name: 'message', short: 'm', long: 'message', takesValue: true },
  { name: 'allowEmpty', long: 'allow-empty' },
];
const parse = (args: string[]) => parseArguments(args, specs, 'git commit [<options>]');

describe('parseArguments', () => {
  it('parses long and short options in every form', () => {
    const parsed = parse(['--all', '-m', 'one', '-mtwo', '--message', 'three', '--message=fo=ur']);

    expect(hasOption(parsed, 'all')).toBe(true);
    expect(optionValues(parsed, 'message')).toEqual(['one', 'two', 'three', 'fo=ur']);
    expect(lastOptionValue(parsed, 'message')).toBe('fo=ur');
  });

  it('supports bundled short flags', () => {
    const parsed = parse(['-am', 'msg']);

    expect(hasOption(parsed, 'all')).toBe(true);
    expect(optionValues(parsed, 'message')).toEqual(['msg']);
  });

  it('separates positionals and arguments after --', () => {
    const parsed = parse(['file.txt', '--allow-empty', '--', '-m', 'x']);

    expect(parsed.positionals).toEqual(['file.txt']);
    expect(parsed.afterSeparator).toEqual(['-m', 'x']);
    expect(hasOption(parsed, 'message')).toBe(false);
    expect(parse([]).afterSeparator).toBeNull();
  });

  it('treats a lone dash as a positional', () => {
    expect(parse(['-']).positionals).toEqual(['-']);
  });

  it.each([
    [['--amend'], "error: unknown option `amend'"],
    [['-x'], "error: unknown switch `x'"],
    [['-m'], "error: switch `m' requires a value"],
    [['--message'], "error: option `message' requires a value"],
    [['--all=yes'], "error: option `all' takes no value"],
  ])('rejects %j with Git wording', (args, message) => {
    expect(() => parse(args)).toThrow(UsageError);
    expect(() => parse(args)).toThrow(`${message}\nusage: git commit [<options>]`);
  });
});
