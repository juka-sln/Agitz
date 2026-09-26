import type { CommandOutcome } from '@/application/git-commands/GitCommand';
import type { Workspace } from '@/domain/entities/Workspace';

import type { OptionSpec, ParsedArguments } from './parseArguments';

/** Adapts a use-case to the command line: declares its options and maps them to a typed input. */
export interface CliCommand {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  readonly options: readonly OptionSpec[];
  execute(args: ParsedArguments, workspace: Workspace): CommandOutcome;
}
