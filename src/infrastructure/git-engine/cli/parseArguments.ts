import { UsageError } from './CommandLineErrors';

export interface OptionSpec {
  /** Key under which the option is stored, shared by its short and long forms. */
  readonly name: string;
  readonly short?: string;
  readonly long?: string;
  readonly takesValue?: boolean;
}

export interface ParsedArguments {
  /** Every occurrence of each option, in order; flags are stored as an empty string. */
  readonly options: ReadonlyMap<string, readonly string[]>;
  readonly positionals: readonly string[];
  /** Arguments after `--`, or `null` when there was no separator. */
  readonly afterSeparator: readonly string[] | null;
}

export function hasOption(parsed: ParsedArguments, name: string): boolean {
  return parsed.options.has(name);
}

export function optionValues(parsed: ParsedArguments, name: string): readonly string[] {
  return parsed.options.get(name) ?? [];
}

export function lastOptionValue(parsed: ParsedArguments, name: string): string | undefined {
  return optionValues(parsed, name).at(-1);
}

/**
 * Parses Git-style options: `--long`, `--long=value`, `--long value`, `-s`,
 * `-svalue`, `-s value` and bundled short flags such as `-am "message"`.
 * Options may appear anywhere; everything after `--` is kept apart.
 */
export function parseArguments(
  args: readonly string[],
  specs: readonly OptionSpec[],
  usage: string,
): ParsedArguments {
  const options = new Map<string, string[]>();
  const positionals: string[] = [];
  let afterSeparator: string[] | null = null;
  const record = (name: string, value: string) => {
    options.set(name, [...(options.get(name) ?? []), value]);
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index] ?? '';

    if (afterSeparator !== null) {
      afterSeparator.push(arg);
    } else if (arg === '--') {
      afterSeparator = [];
    } else if (arg.startsWith('--')) {
      const [name = '', inlineValue] = arg.slice(2).split(/=(.*)/s, 2);
      const spec = specs.find((candidate) => candidate.long === name);
      if (!spec) {
        throw new UsageError(`error: unknown option \`${name}'`, usage);
      }
      if (spec.takesValue === true) {
        const value = inlineValue ?? args[index + 1];
        if (value === undefined) {
          throw new UsageError(`error: option \`${name}' requires a value`, usage);
        }
        if (inlineValue === undefined) {
          index += 1;
        }
        record(spec.name, value);
      } else if (inlineValue !== undefined) {
        throw new UsageError(`error: option \`${name}' takes no value`, usage);
      } else {
        record(spec.name, '');
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      for (let position = 1; position < arg.length; position += 1) {
        const letter = arg.charAt(position);
        const spec = specs.find((candidate) => candidate.short === letter);
        if (!spec) {
          throw new UsageError(`error: unknown switch \`${letter}'`, usage);
        }
        if (spec.takesValue !== true) {
          record(spec.name, '');
          continue;
        }
        const attached = arg.slice(position + 1);
        const value = attached === '' ? args[index + 1] : attached;
        if (value === undefined) {
          throw new UsageError(`error: switch \`${letter}' requires a value`, usage);
        }
        if (attached === '') {
          index += 1;
        }
        record(spec.name, value);
        break;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { options, positionals, afterSeparator };
}
