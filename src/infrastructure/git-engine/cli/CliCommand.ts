import type { CommandOutcome } from '@/application/git-commands/GitCommand';
import type { Network } from '@/domain/entities/Network';
import type { Workspace } from '@/domain/entities/Workspace';

import type { OptionSpec, ParsedArguments } from './parseArguments';

/** Adapts a use-case to the command line: declares its options and maps them to a typed input. */
export interface CliCommand {
  readonly name: string;
  readonly summary: string;
  readonly usage: string;
  readonly options: readonly OptionSpec[];
  /** `network` holds the hosted repositories, for the commands that talk to a remote. */
  execute(args: ParsedArguments, workspace: Workspace, network: Network): CommandOutcome;
}
