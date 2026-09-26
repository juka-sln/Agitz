import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { MergeCommand } from '@/application/git-commands/MergeCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError, NotSupportedError } from '../CommandLineErrors';
import { hasOption, lastOptionValue } from '../parseArguments';

export function createMergeCliCommand(context: GitCommandContext): CliCommand {
  const command = new MergeCommand(context);
  return {
    name: 'merge',
    summary: 'Join two or more development histories together',
    usage: [
      'git merge [--no-ff | --ff-only] [-m <msg>] <branch>',
      '   or: git merge --abort',
      '   or: git merge --continue',
    ].join('\n'),
    options: [
      { name: 'noFastForward', long: 'no-ff' },
      { name: 'fastForwardOnly', long: 'ff-only' },
      { name: 'fastForward', long: 'ff' },
      { name: 'message', short: 'm', long: 'message', takesValue: true },
      { name: 'abort', long: 'abort' },
      { name: 'continue', long: 'continue' },
    ],
    execute(args, workspace) {
      if (hasOption(args, 'abort')) {
        return command.execute(workspace, { action: 'abort' });
      }
      if (hasOption(args, 'continue')) {
        return command.execute(workspace, { action: 'continue' });
      }
      const [target, ...others] = args.positionals;
      if (target === undefined) {
        throw new CommandLineError('fatal: No remote for the current branch.');
      }
      if (others.length > 0) {
        throw new NotSupportedError('merging several branches at once (octopus merge)');
      }
      return command.execute(workspace, {
        action: 'merge',
        target,
        noFastForward: hasOption(args, 'noFastForward'),
        fastForwardOnly: hasOption(args, 'fastForwardOnly'),
        message: lastOptionValue(args, 'message'),
      });
    },
  };
}
