import { explain } from '@/application/git-commands/GitCommand';
import {
  runGitCommand,
  unchangedResult,
  type CommandResult,
} from '@/application/git-commands/runGitCommand';
import type { Workspace } from '@/domain/entities/Workspace';

import { ShellSyntaxError, tokenizeShell, type ShellToken } from '../git-engine/cli/tokenize';
import { createGitEngine, type GitEngine } from '../git-engine/GitEngine';

import { FILE_BUILTINS, type Builtin, type Redirect } from './builtins';
import { completeCommandLine, type Completion } from './completion';

export interface Shell {
  /** Every command name the shell understands, `git` included. */
  readonly commandNames: readonly string[];
  execute(commandLine: string, workspace: Workspace): CommandResult;
  complete(commandLine: string, workspace: Workspace): Completion;
}

type ParsedLine =
  | { readonly words: readonly string[]; readonly redirect: Redirect | null }
  | { readonly error: string };

/** Accepts a single trailing redirection: `<command> <args...> > <file>`. */
function parseLine(tokens: readonly ShellToken[]): ParsedLine {
  const words: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token?.type === 'word') {
      words.push(token.value);
    } else if (token?.type === 'redirect') {
      const target = tokens[index + 1];
      if (target?.type !== 'word') {
        const unexpected = target === undefined ? 'newline' : '>';
        return { error: `agitz: syntax error near unexpected token \`${unexpected}'` };
      }
      if (index + 2 < tokens.length) {
        return { error: 'agitz: the redirection must come last, e.g. echo "text" > file.txt' };
      }
      return { words, redirect: { target: target.value, append: token.append } };
    }
  }
  return { words, redirect: null };
}

function createHelpBuiltin(builtins: readonly Builtin[]): Builtin {
  return {
    name: 'help',
    usage: 'help',
    description: 'show this list',
    run({ workspace }) {
      const rows = [
        { usage: 'git <command>', description: 'run a Git command (git help lists them)' },
        ...builtins,
        { usage: 'clear', description: 'clear the terminal' },
      ];
      const width = Math.max(...rows.map((row) => row.usage.length)) + 3;
      return {
        workspace,
        output: [
          'Available commands:',
          ...rows.map((row) => `  ${row.usage.padEnd(width)}${row.description}`),
        ].join('\n'),
        exitCode: 0,
        explanation: explain('shell.help'),
      };
    },
  };
}

/** A tiny POSIX-like shell: file commands for the simulated project, and `git` routed to the engine. */
export function createShell(gitEngine: GitEngine = createGitEngine()): Shell {
  const builtins = [...FILE_BUILTINS];
  builtins.push(createHelpBuiltin(builtins));
  const builtinsByName = new Map(builtins.map((builtin) => [builtin.name, builtin]));
  const shellCommands = [...builtinsByName.keys(), 'clear'].sort();

  return {
    commandNames: ['git', ...shellCommands],

    execute(commandLine, workspace) {
      let tokens: ShellToken[];
      try {
        tokens = tokenizeShell(commandLine);
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

      const parsed = parseLine(tokens);
      if ('error' in parsed) {
        return unchangedResult(workspace, parsed.error, 2, explain('shell.syntaxError'));
      }
      const [program, ...args] = parsed.words;
      if (program === undefined) {
        return unchangedResult(workspace, '', 0, explain('shell.empty'));
      }

      const builtin = builtinsByName.get(program);
      const acceptsRedirect = builtin?.acceptsRedirect === true;
      if (parsed.redirect !== null && !acceptsRedirect) {
        return unchangedResult(
          workspace,
          'agitz: output redirection is only supported with echo',
          2,
          explain('shell.redirectUnsupported', { command: program }),
        );
      }
      if (program === 'git') {
        return gitEngine.executeArguments(args, workspace);
      }
      if (!builtin) {
        return unchangedResult(
          workspace,
          `${program}: command not found`,
          127,
          explain('shell.commandNotFound', { command: program }),
        );
      }
      return runGitCommand(workspace, (current) =>
        builtin.run({ args, workspace: current, redirect: parsed.redirect }),
      );
    },

    complete(commandLine, workspace) {
      return completeCommandLine(
        commandLine,
        workspace,
        shellCommands,
        gitEngine.availableCommands,
      );
    },
  };
}
