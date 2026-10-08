import { CommitCommand } from '@/application/git-commands/CommitCommand';
import type { GitCommandContext } from '@/application/git-commands/GitCommand';

import type { CliCommand } from '../CliCommand';
import { NotSupportedError } from '../CommandLineErrors';
import { hasOption, optionValues } from '../parseArguments';

export function createCommitCliCommand(context: GitCommandContext): CliCommand {
  const command = new CommitCommand(context);
  return {
    name: 'commit',
    summary: 'Record changes to the repository',
    usage: 'git commit [-a | --all] [--allow-empty] [--amend [--no-edit]] [-m <msg>]',
    options: [
      { name: 'message', short: 'm', long: 'message', takesValue: true },
      { name: 'all', short: 'a', long: 'all' },
      { name: 'allowEmpty', long: 'allow-empty' },
      { name: 'amend', long: 'amend' },
      { name: 'noEdit', long: 'no-edit' },
    ],
    execute(args, workspace) {
      if (args.positionals.length > 0 || (args.afterSeparator ?? []).length > 0) {
        throw new NotSupportedError('committing specific paths (stage them with git add first)');
      }
      return command.execute(workspace, {
        messages: optionValues(args, 'message'),
        all: hasOption(args, 'all'),
        allowEmpty: hasOption(args, 'allowEmpty'),
        amend: hasOption(args, 'amend'),
      });
    },
  };
}
