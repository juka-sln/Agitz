import { BranchCommand } from '@/application/git-commands/BranchCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError } from '../CommandLineErrors';
import { hasOption, lastOptionValue, optionValues } from '../parseArguments';

export function createBranchCliCommand(): CliCommand {
  const command = new BranchCommand();
  return {
    name: 'branch',
    summary: 'List, create, or delete branches',
    usage: [
      'git branch [-v | -vv] [-r | -a] [-l]',
      '   or: git branch (-u | --set-upstream-to=) <upstream> [<branch-name>]',
      '   or: git branch --unset-upstream [<branch-name>]',
      '   or: git branch [-f] <branch-name> [<start-point>]',
      '   or: git branch (-d | -D) <branch-name>...',
      '   or: git branch (-m | -M) [<old-branch>] <new-branch>',
    ].join('\n'),
    options: [
      { name: 'delete', short: 'd', long: 'delete' },
      { name: 'forceDelete', short: 'D' },
      { name: 'move', short: 'm', long: 'move' },
      { name: 'forceMove', short: 'M' },
      { name: 'force', short: 'f', long: 'force' },
      { name: 'verbose', short: 'v', long: 'verbose' },
      { name: 'list', short: 'l', long: 'list' },
      { name: 'remotes', short: 'r', long: 'remotes' },
      { name: 'all', short: 'a', long: 'all' },
      { name: 'setUpstreamTo', short: 'u', long: 'set-upstream-to', takesValue: true },
      { name: 'unsetUpstream', long: 'unset-upstream' },
    ],
    execute(args, workspace) {
      const names = args.positionals;
      const force = hasOption(args, 'force');

      const upstream = lastOptionValue(args, 'setUpstreamTo');
      if (upstream !== undefined || hasOption(args, 'unsetUpstream')) {
        const [branch, ...extra] = names;
        if (extra.length > 0) {
          throw new CommandLineError('fatal: too many arguments to set new upstream');
        }
        return upstream === undefined
          ? command.execute(workspace, { action: 'unsetUpstream', branch })
          : command.execute(workspace, { action: 'setUpstream', upstream, branch });
      }

      if (hasOption(args, 'delete') || hasOption(args, 'forceDelete')) {
        if (names.length === 0) {
          throw new CommandLineError('fatal: branch name required');
        }
        return command.execute(workspace, {
          action: 'delete',
          names,
          force: force || hasOption(args, 'forceDelete'),
        });
      }

      if (hasOption(args, 'move') || hasOption(args, 'forceMove')) {
        const [first, second, ...extra] = names;
        if (first === undefined) {
          throw new CommandLineError('fatal: branch name required');
        }
        if (extra.length > 0) {
          throw new CommandLineError('fatal: too many arguments for a rename operation');
        }
        return command.execute(workspace, {
          action: 'rename',
          oldName: second === undefined ? undefined : first,
          newName: second ?? first,
          force: force || hasOption(args, 'forceMove'),
        });
      }

      const [name, startPoint, ...extra] = names;
      const scope = hasOption(args, 'all')
        ? 'all'
        : hasOption(args, 'remotes')
          ? 'remote'
          : 'local';
      if (name === undefined || hasOption(args, 'list') || scope !== 'local') {
        return command.execute(workspace, {
          action: 'list',
          verbosity: optionValues(args, 'verbose').length,
          scope,
        });
      }
      if (extra.length > 0) {
        throw new CommandLineError('fatal: too many arguments to create a branch');
      }
      return command.execute(workspace, { action: 'create', name, startPoint, force });
    },
  };
}
