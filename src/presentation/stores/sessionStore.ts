import { createStore } from 'zustand/vanilla';

import type { Explanation } from '@/application/git-commands/GitCommand';
import type { CommandResult } from '@/application/git-commands/runGitCommand';
import type { TeamSetup } from '@/application/simulation/teamSetup';
import type { Network } from '@/domain/entities/Network';
import {
  createSimulatedUser,
  findUserNameProblem,
  projectDirectory,
  type SimulatedUser,
  type UserNameProblem,
} from '@/domain/entities/SimulatedUser';
import { createWorkspace, type Workspace } from '@/domain/entities/Workspace';
import type { Completion } from '@/infrastructure/shell/completion';
import type { Shell } from '@/infrastructure/shell/Shell';

export interface TerminalEntry {
  readonly id: number;
  /** The workspace as it was when the command was typed, to render its prompt. */
  readonly workspaceBefore: Workspace;
  readonly commandLine: string;
  readonly output: string;
  readonly exitCode: number;
  readonly explanation: Explanation;
}

/** Everything that belongs to one user's machine: files, repository and terminal. */
export interface Workstation {
  readonly user: SimulatedUser;
  readonly workspace: Workspace;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly lastResult: CommandResult | null;
  readonly showWelcome: boolean;
}

export interface SessionState {
  readonly users: readonly SimulatedUser[];
  readonly activeUser: SimulatedUser;
  /** The workstations of the other users, as they were left. */
  readonly otherWorkstations: Readonly<Record<string, Workstation>>;
  /** Repositories hosted on the virtual GitHub, shared by every workstation. */
  readonly network: Network;

  // The active workstation, kept flat because nearly every component reads it.
  readonly workspace: Workspace;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly lastResult: CommandResult | null;
  readonly showWelcome: boolean;

  readonly run: (commandLine: string) => void;
  readonly complete: (commandLine: string) => Completion;
  readonly clear: () => void;
  readonly switchUser: (userId: string) => void;
  /** Creates a teammate with an empty workstation, or tells why the name is refused. */
  readonly addUser: (name: string) => UserNameProblem | null;
}

export type SessionStore = ReturnType<typeof createSessionStore>;

function createWorkstation(user: SimulatedUser): Workstation {
  return {
    user,
    workspace: createWorkspace(projectDirectory(user), user.identity),
    entries: [],
    commandHistory: [],
    lastResult: null,
    showWelcome: true,
  };
}

function activeWorkstation(state: SessionState): Workstation {
  return {
    user: state.activeUser,
    workspace: state.workspace,
    entries: state.entries,
    commandHistory: state.commandHistory,
    lastResult: state.lastResult,
    showWelcome: state.showWelcome,
  };
}

function flatten({ user, ...workstation }: Workstation) {
  return { activeUser: user, ...workstation };
}

export function createSessionStore(shell: Shell, team: TeamSetup) {
  const [firstUser, ...otherUsers] = team.users;
  if (firstUser === undefined) {
    throw new Error('A session needs at least one user');
  }
  let nextId = 1;

  return createStore<SessionState>()((set, get) => ({
    users: team.users,
    network: team.network,
    otherWorkstations: Object.fromEntries(
      otherUsers.map((user) => [user.id, createWorkstation(user)]),
    ),
    ...flatten(createWorkstation(firstUser)),

    run(commandLine) {
      const trimmed = commandLine.trim();
      if (trimmed === 'clear') {
        get().clear();
        set((state) => ({ commandHistory: [...state.commandHistory, trimmed] }));
        return;
      }

      const { workspace, commandHistory, entries, network } = get();
      const result = shell.execute(trimmed, workspace, network);
      const entry: TerminalEntry = {
        id: nextId,
        workspaceBefore: workspace,
        commandLine: trimmed,
        output: result.output,
        exitCode: result.exitCode,
        explanation: result.explanation,
      };
      nextId += 1;

      set({
        workspace: result.workspace,
        network: result.network ?? network,
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

    switchUser(userId) {
      const state = get();
      const target = state.otherWorkstations[userId];
      if (target === undefined) {
        return;
      }
      const others = Object.fromEntries(
        Object.entries(state.otherWorkstations).filter(([id]) => id !== userId),
      );
      set({
        ...flatten(target),
        otherWorkstations: { ...others, [state.activeUser.id]: activeWorkstation(state) },
      });
    },

    addUser(name) {
      const { users, otherWorkstations } = get();
      const problem = findUserNameProblem(name, users);
      if (problem !== null) {
        return problem;
      }
      const user = createSimulatedUser(name);
      set({
        users: [...users, user],
        otherWorkstations: { ...otherWorkstations, [user.id]: createWorkstation(user) },
      });
      return null;
    },
  }));
}
