import { createStore } from 'zustand/vanilla';

import type { CommandResult } from '@/application/git-commands/runGitCommand';
import type { Workspace } from '@/domain/entities/Workspace';
import type { Completion } from '@/infrastructure/shell/completion';
import type { Shell } from '@/infrastructure/shell/Shell';

export interface TerminalEntry {
  readonly id: number;
  /** The workspace as it was when the command was typed, to render its prompt. */
  readonly workspaceBefore: Workspace;
  readonly commandLine: string;
  readonly output: string;
  readonly exitCode: number;
}

export interface SessionState {
  readonly workspace: Workspace;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly lastResult: CommandResult | null;
  readonly showWelcome: boolean;
  readonly run: (commandLine: string) => void;
  readonly complete: (commandLine: string) => Completion;
  readonly clear: () => void;
}

export type SessionStore = ReturnType<typeof createSessionStore>;

export function createSessionStore(shell: Shell, initialWorkspace: Workspace) {
  let nextId = 1;

  return createStore<SessionState>()((set, get) => ({
    workspace: initialWorkspace,
    entries: [],
    commandHistory: [],
    lastResult: null,
    showWelcome: true,

    run(commandLine) {
      const trimmed = commandLine.trim();
      if (trimmed === 'clear') {
        get().clear();
        set((state) => ({ commandHistory: [...state.commandHistory, trimmed] }));
        return;
      }

      const { workspace, commandHistory, entries } = get();
      const result = shell.execute(trimmed, workspace);
      const entry: TerminalEntry = {
        id: nextId,
        workspaceBefore: workspace,
        commandLine: trimmed,
        output: result.output,
        exitCode: result.exitCode,
      };
      nextId += 1;

      set({
        workspace: result.workspace,
        entries: [...entries, entry],
        lastResult: result,
        commandHistory:
          trimmed === '' || commandHistory.at(-1) === trimmed
            ? commandHistory
            : [...commandHistory, trimmed],
      });
    },

    complete(commandLine) {
      return shell.complete(commandLine, get().workspace);
    },

    clear() {
      set({ entries: [], showWelcome: false });
    },
  }));
}
