import type { GitCommandContext } from '@/application/git-commands/GitCommand';
import { explain } from '@/application/git-commands/GitCommand';
import {
  runGitCommand,
  unchangedResult,
  type CommandResult,
} from '@/application/git-commands/runGitCommand';
import type { Workspace } from '@/domain/entities/Workspace';

import type { CliCommand } from './cli/CliCommand';
import { expandNumericLogShorthand } from './cli/commands/logCliCommand';
import { createCliCommands, PLANNED_COMMANDS } from './cli/commands/registry';
import { parseArguments } from './cli/parseArguments';
import { suggestCommands } from './cli/suggestCommands';
import { ShellSyntaxError, tokenize } from './cli/tokenize';
import { Sha1ObjectHasher } from './Sha1ObjectHasher';
import { SystemClock } from './SystemClock';

export const GIT_VERSION = '2.46.0';

export interface GitEngine {
  /** Names of the Git commands the engine can run, for help and autocompletion. */
  readonly availableCommands: readonly string[];
  execute(commandLine: string, workspace: Workspace): CommandResult;
}

function formatHelp(commands: readonly CliCommand[]): string {
  const width = Math.max(...commands.map((command) => command.name.length)) + 3;
  return [
    'usage: git [--version] [--help] <command> [<args>]',
    '',
    'These are the Git commands available in Agitz:',
    '',
    ...commands.map((command) => `   ${command.name.padEnd(width)}${command.summary}`),
  ].join('\n');
}

function formatUnknownCommand(name: string, suggestions: readonly string[]): string {
  const lines = [`git: '${name}' is not a git command. See 'git --help'.`];
  if (suggestions.length > 0) {
    lines.push(
      '',
      suggestions.length === 1 ? 'The most similar command is' : 'The most similar commands are',
      ...suggestions.map((suggestion) => `\t${suggestion}`),
    );
  }
  return lines.join('\n');
}

export function createGitEngine(
  context: GitCommandContext = { hasher: new Sha1ObjectHasher(), clock: new SystemClock() },
): GitEngine {
  const commands = createCliCommands(context);
  const commandsByName = new Map(commands.map((command) => [command.name, command]));
  const plannedCommands = new Set<string>(PLANNED_COMMANDS);

  function executeGit(args: readonly string[], workspace: Workspace): CommandResult {
    const [name, ...rest] = args;

    if (name === undefined) {
      return unchangedResult(workspace, formatHelp(commands), 1, explain('shell.gitUsage'));
    }
    if (name === '--help' || name === 'help') {
      return unchangedResult(workspace, formatHelp(commands), 0, explain('shell.gitUsage'));
    }
    if (name === '--version' || name === 'version') {
      return unchangedResult(workspace, `git version ${GIT_VERSION}`, 0, explain('shell.version'));
    }

    const command = commandsByName.get(name);
    if (!command) {
      if (plannedCommands.has(name)) {
        return unchangedResult(
          workspace,
          `agitz: 'git ${name}' is not available yet`,
          1,
          explain('shell.notImplemented', { command: name }),
        );
      }
      const suggestions = suggestCommands(name, [...commandsByName.keys(), ...plannedCommands]);
      return unchangedResult(
        workspace,
        formatUnknownCommand(name, suggestions),
        1,
        explain('shell.unknownGitCommand', { command: name, suggestions: suggestions.join(', ') }),
      );
    }

    const commandArgs = name === 'log' ? expandNumericLogShorthand(rest) : rest;
    return runGitCommand(workspace, (current) =>
      command.execute(parseArguments(commandArgs, command.options, command.usage), current),
    );
  }

  return {
    availableCommands: [...commandsByName.keys()],
    execute(commandLine, workspace) {
      let tokens: string[];
      try {
        tokens = tokenize(commandLine);
      } catch (error) {
        if (error instanceof ShellSyntaxError) {
          return unchangedResult(
            workspace,
            `agitz: ${error.message}`,
            2,
            explain('shell.syntaxError'),
          );
        }
        throw error;
      }

      const [program, ...args] = tokens;
      if (program === undefined) {
        return unchangedResult(workspace, '', 0, explain('shell.empty'));
      }
      if (program !== 'git') {
        return unchangedResult(
          workspace,
          `${program}: command not found`,
          127,
          explain('shell.commandNotFound', { command: program }),
        );
      }
      return executeGit(args, workspace);
    },
  };
}
