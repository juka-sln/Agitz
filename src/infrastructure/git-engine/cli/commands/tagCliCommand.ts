import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { TagCommand } from '@/application/git-commands/TagCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError } from '../CommandLineErrors';
import { hasOption, optionValues } from '../parseArguments';

export function createTagCliCommand(context: GitCommandContext): CliCommand {
  const command = new TagCommand(context);
  return {
    name: 'tag',
    summary: 'Create, list or delete tags',
    usage: [
      'git tag [-l [<pattern>]]',
      '   or: git tag [-f] [-a -m <msg>] <tagname> [<commit>]',
      '   or: git tag -d <tagname>...',
    ].join('\n'),
    options: [
      { name: 'annotate', short: 'a', long: 'annotate' },
      { name: 'message', short: 'm', long: 'message', takesValue: true },
      { name: 'delete', short: 'd', long: 'delete' },
      { name: 'list', short: 'l', long: 'list' },
      { name: 'force', short: 'f', long: 'force' },
    ],
    execute(args, workspace) {
      const [name, target, ...extra] = args.positionals;
      if (hasOption(args, 'delete')) {
        if (name === undefined) {
          throw new CommandLineError('fatal: tag name required');
        }
        return command.execute(workspace, { action: 'delete', names: args.positionals });
      }
      if (name === undefined || hasOption(args, 'list')) {
        return command.execute(workspace, { action: 'list', pattern: name });
      }
      if (extra.length > 0) {
        throw new CommandLineError('fatal: too many arguments');
      }
      const messages = optionValues(args, 'message');
      return command.execute(workspace, {
        action: 'create',
        name,
        target,
        message: messages.length === 0 ? undefined : messages.join('\n\n'),
        annotated: hasOption(args, 'annotate'),
        force: hasOption(args, 'force'),
      });
    },
  };
}
