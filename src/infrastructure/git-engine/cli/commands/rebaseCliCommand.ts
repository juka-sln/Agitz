import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { RebaseCommand } from '@/application/git-commands/RebaseCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError, NotSupportedError } from '../CommandLineErrors';
import { hasOption } from '../parseArguments';

export function createRebaseCliCommand(context: GitCommandContext): CliCommand {
  const command = new RebaseCommand(context);
  return {
    name: 'rebase',
    summary: 'Reapply commits on top of another base tip',
    usage: 'git rebase <upstream>\n   or: git rebase (--continue | --skip | --abort)',
    options: [
      { name: 'continue', long: 'continue' },
      { name: 'skip', long: 'skip' },
      { name: 'abort', long: 'abort' },
      { name: 'interactive', short: 'i', long: 'interactive' },
      { name: 'onto', long: 'onto', takesValue: true },
    ],
    execute(args, workspace) {
      for (const action of ['continue', 'skip', 'abort'] as const) {
        if (hasOption(args, action)) {
          return command.execute(workspace, { action });
        }
      }
      if (hasOption(args, 'interactive')) {
        throw new NotSupportedError('interactive rebase (git rebase -i)');
      }
      if (hasOption(args, 'onto')) {
        throw new NotSupportedError('git rebase --onto');
      }
      const [upstream] = args.positionals;
      if (upstream === undefined) {
        throw new CommandLineError(
          'There is no tracking information for the current branch.\nPlease specify which branch you want to rebase against.',
          1,
        );
      }
      return command.execute(workspace, { action: 'start', upstream });
    },
  };
}
