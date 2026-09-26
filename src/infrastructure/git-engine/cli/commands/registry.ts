import type { GitCommandContext } from '@/application/git-commands/GitCommand';

import type { CliCommand } from '../CliCommand';

import { createAddCliCommand } from './addCliCommand';
import { createBranchCliCommand } from './branchCliCommand';
import { createCheckoutCliCommand } from './checkoutCliCommand';
import { createCommitCliCommand } from './commitCliCommand';
import { createInitCliCommand } from './initCliCommand';
import { createLogCliCommand } from './logCliCommand';
import { createStatusCliCommand } from './statusCliCommand';

export function createCliCommands(context: GitCommandContext): CliCommand[] {
  return [
    createInitCliCommand(),
    createAddCliCommand(context),
    createStatusCliCommand(),
    createCommitCliCommand(context),
    createLogCliCommand(),
    createBranchCliCommand(),
    createCheckoutCliCommand(context),
  ];
}

/** Real Git commands that Agitz will simulate in upcoming versions. */
export const PLANNED_COMMANDS = [
  'archive',
  'bisect',
  'blame',
  'cherry-pick',
  'clean',
  'clone',
  'config',
  'diff',
  'fetch',
  'fsck',
  'gc',
  'merge',
  'mv',
  'pull',
  'push',
  'rebase',
  'reflog',
  'remote',
  'reset',
  'restore',
  'revert',
  'rm',
  'show',
  'stash',
  'submodule',
  'switch',
  'tag',
  'worktree',
] as const;
