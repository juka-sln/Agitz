import {
  CherryPickCommand,
  type SequenceInput,
} from '@/application/git-commands/CherryPickCommand';
import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { RevertCommand } from '@/application/git-commands/RevertCommand';

import type { CliCommand } from '../CliCommand';
import { CommandLineError } from '../CommandLineErrors';
import { hasOption, type OptionSpec, type ParsedArguments } from '../parseArguments';

const SEQUENCE_OPTIONS: readonly OptionSpec[] = [
  { name: 'continue', long: 'continue' },
  { name: 'skip', long: 'skip' },
  { name: 'abort', long: 'abort' },
  { name: 'noEdit', long: 'no-edit' },
];

function toSequenceInput(args: ParsedArguments): SequenceInput {
  for (const action of ['continue', 'skip', 'abort'] as const) {
    if (hasOption(args, action)) {
      return { action };
    }
  }
  if (args.positionals.length === 0) {
    throw new CommandLineError('fatal: empty commit set passed');
  }
  return { action: 'start', commits: args.positionals };
}

export function createCherryPickCliCommand(context: GitCommandContext): CliCommand {
  const command = new CherryPickCommand(context);
  return {
    name: 'cherry-pick',
    summary: 'Apply the changes introduced by some existing commits',
    usage: 'git cherry-pick <commit>...\n   or: git cherry-pick (--continue | --skip | --abort)',
    options: SEQUENCE_OPTIONS,
    execute(args, workspace) {
      return command.execute(workspace, toSequenceInput(args));
    },
  };
}

export function createRevertCliCommand(context: GitCommandContext): CliCommand {
  const command = new RevertCommand(context);
  return {
    name: 'revert',
    summary: 'Revert some existing commits',
    usage: 'git revert <commit>...\n   or: git revert (--continue | --skip | --abort)',
    options: SEQUENCE_OPTIONS,
    execute(args, workspace) {
      return command.execute(workspace, toSequenceInput(args));
    },
  };
}
