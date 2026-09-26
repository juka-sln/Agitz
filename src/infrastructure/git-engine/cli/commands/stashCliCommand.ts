import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { StashCommand } from '@/application/git-commands/StashCommand';

import type { CliCommand } from '../CliCommand';
import { NotSupportedError, UsageError } from '../CommandLineErrors';
import { hasOption, lastOptionValue } from '../parseArguments';

const USAGE = [
  'git stash [push [-m <message>] [-u | --include-untracked]]',
  '   or: git stash list',
  '   or: git stash (pop | apply | drop) [<stash>]',
].join('\n');

export function createStashCliCommand(context: GitCommandContext): CliCommand {
  const command = new StashCommand(context);
  return {
    name: 'stash',
    summary: 'Stash the changes in a dirty working directory away',
    usage: USAGE,
    options: [
      { name: 'message', short: 'm', long: 'message', takesValue: true },
      { name: 'includeUntracked', short: 'u', long: 'include-untracked' },
    ],
    execute(args, workspace) {
      const [subcommand = 'push', reference] = args.positionals;
      switch (subcommand) {
        case 'push':
          return command.execute(workspace, {
            action: 'push',
            message: lastOptionValue(args, 'message'),
            includeUntracked: hasOption(args, 'includeUntracked'),
          });
        case 'list':
          return command.execute(workspace, { action: 'list' });
        case 'pop':
        case 'apply':
        case 'drop':
          return command.execute(workspace, { action: subcommand, reference });
        case 'show':
        case 'clear':
        case 'branch':
          throw new NotSupportedError(`git stash ${subcommand}`);
        default:
          throw new UsageError(`error: unknown subcommand: \`${subcommand}'`, USAGE);
      }
    },
  };
}
