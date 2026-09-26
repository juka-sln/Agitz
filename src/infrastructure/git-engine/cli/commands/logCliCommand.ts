import { LogCommand } from '@/application/git-commands/LogCommand';

import type { CliCommand } from '../CliCommand';
import { NotSupportedError, UsageError } from '../CommandLineErrors';
import { hasOption, lastOptionValue } from '../parseArguments';

const USAGE = 'git log [--oneline] [--all] [-n <number> | -<number>] [<revision>...]';

function parseMaxCount(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    throw new UsageError("error: option `max-count' expects a numerical value", USAGE);
  }
  return Number(value);
}

export function createLogCliCommand(): CliCommand {
  const command = new LogCommand();
  return {
    name: 'log',
    summary: 'Show commit logs',
    usage: USAGE,
    options: [
      { name: 'oneline', long: 'oneline' },
      { name: 'all', long: 'all' },
      { name: 'maxCount', short: 'n', long: 'max-count', takesValue: true },
    ],
    execute(args, workspace) {
      if ((args.afterSeparator ?? []).length > 0) {
        throw new NotSupportedError('filtering git log by path');
      }
      return command.execute(workspace, {
        revisions: args.positionals,
        oneline: hasOption(args, 'oneline'),
        all: hasOption(args, 'all'),
        maxCount: parseMaxCount(lastOptionValue(args, 'maxCount')),
      });
    },
  };
}

/** Git accepts `-3` as a shorthand for `-n 3`. */
export function expandNumericLogShorthand(args: readonly string[]): string[] {
  return args.flatMap((arg) => (/^-\d+$/.test(arg) ? ['-n', arg.slice(1)] : [arg]));
}
