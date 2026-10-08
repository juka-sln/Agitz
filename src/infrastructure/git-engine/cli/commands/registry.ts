import type { GitCommandContext } from '@/application/git-commands/GitCommand';

import type { CliCommand } from '../CliCommand';

import { createAddCliCommand } from './addCliCommand';
import { createBranchCliCommand } from './branchCliCommand';
import { createCheckoutCliCommand } from './checkoutCliCommand';
import { createCommitCliCommand } from './commitCliCommand';
import { createInitCliCommand } from './initCliCommand';
import { createLogCliCommand } from './logCliCommand';
import { createMergeCliCommand } from './mergeCliCommand';
import { createRebaseCliCommand } from './rebaseCliCommand';
import {
  createCloneCliCommand,
  createFetchCliCommand,
  createPullCliCommand,
  createPushCliCommand,
  createRemoteCliCommand,
} from './remoteCliCommands';
import { createResetCliCommand } from './resetCliCommand';
import { createCherryPickCliCommand, createRevertCliCommand } from './sequenceCliCommands';
import { createStashCliCommand } from './stashCliCommand';
import { createStatusCliCommand } from './statusCliCommand';
import { createTagCliCommand } from './tagCliCommand';

export function createCliCommands(context: GitCommandContext): CliCommand[] {
  return [
    createInitCliCommand(),
    createAddCliCommand(context),
    createStatusCliCommand(),
    createCommitCliCommand(context),
    createLogCliCommand(),
    createBranchCliCommand(),
    createCheckoutCliCommand(context),
    createMergeCliCommand(context),
    createRebaseCliCommand(context),
    createCherryPickCliCommand(context),
    createResetCliCommand(),
    createRevertCliCommand(context),
    createStashCliCommand(context),
    createTagCliCommand(context),
    createCloneCliCommand(),
    createRemoteCliCommand(),
    createFetchCliCommand(),
    createPullCliCommand(context),
    createPushCliCommand(),
  ];
}

/** Real Git commands that Agitz will simulate in upcoming versions. */
export const PLANNED_COMMANDS = [
  'archive',
  'bisect',
  'blame',
  'clean',
  'config',
  'diff',
  'fsck',
  'gc',
  'mv',
  'reflog',
  'restore',
  'rm',
  'show',
  'submodule',
  'switch',
  'worktree',
] as const;
