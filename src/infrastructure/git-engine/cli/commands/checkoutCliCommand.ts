import { CheckoutCommand } from '@/application/git-commands/CheckoutCommand';
import type { GitCommandContext } from '@/application/git-commands/GitCommand';

import type { CliCommand } from '../CliCommand';
import { hasOption, lastOptionValue } from '../parseArguments';

export function createCheckoutCliCommand(context: GitCommandContext): CliCommand {
  const command = new CheckoutCommand(context);
  return {
    name: 'checkout',
    summary: 'Switch branches or restore working tree files',
    usage: [
      'git checkout [--detach] <branch-or-commit>',
      '   or: git checkout -b <new-branch> [<start-point>]',
      '   or: git checkout [<commit>] [--] <pathspec>...',
    ].join('\n'),
    options: [
      { name: 'newBranch', short: 'b', takesValue: true },
      { name: 'detach', long: 'detach' },
    ],
    execute(args, workspace) {
      return command.execute(workspace, {
        targets: args.positionals,
        paths: args.afterSeparator ?? undefined,
        newBranch: lastOptionValue(args, 'newBranch'),
        detach: hasOption(args, 'detach'),
      });
    },
  };
}
