import { InitCommand } from '@/application/git-commands/InitCommand';

import type { CliCommand } from '../CliCommand';
import { NotSupportedError } from '../CommandLineErrors';
import { lastOptionValue } from '../parseArguments';

export function createInitCliCommand(): CliCommand {
  const command = new InitCommand();
  return {
    name: 'init',
    summary: 'Create an empty Git repository or reinitialize an existing one',
    usage: 'git init [-b <branch-name> | --initial-branch=<branch-name>]',
    options: [{ name: 'initialBranch', short: 'b', long: 'initial-branch', takesValue: true }],
    execute(args, workspace) {
      if (args.positionals.length > 0) {
        throw new NotSupportedError('initializing a repository in another directory');
      }
      return command.execute(workspace, { initialBranch: lastOptionValue(args, 'initialBranch') });
    },
  };
}
