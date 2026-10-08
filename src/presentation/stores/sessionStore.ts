import { createStore } from 'zustand/vanilla';

import type { Explanation } from '@/application/git-commands/GitCommand';
import type { CommandResult } from '@/application/git-commands/runGitCommand';
import type { GitHubActions } from '@/application/github-features/GitHubActions';
import {
  runGitHubAction,
  type GitHubProblem,
  type HostingState,
} from '@/application/github-features/HostingState';
import { runWorkflows } from '@/application/github-features/runWorkflows';
import type { ScriptStep } from '@/application/simulation/conflictScenario';
import type { TeamSetup } from '@/application/simulation/teamSetup';
import type { GitHub } from '@/domain/entities/GitHub';
import type { Network } from '@/domain/entities/Network';
import {
  createSimulatedUser,
  findUserNameProblem,
  projectDirectory,
  type SimulatedUser,
  type UserNameProblem,
} from '@/domain/entities/SimulatedUser';
import {
  createWorkspace,
  findFileWriteProblem,
  writeFile,
  type FileWriteProblem,
  type Workspace,
} from '@/domain/entities/Workspace';
import type { Completion } from '@/infrastructure/shell/completion';
import type { Shell } from '@/infrastructure/shell/Shell';

import { describePrompt, type PromptParts } from '../hooks/usePrompt';

export interface TerminalEntry {
  readonly id: number;
  /** The prompt as it was when the command was typed. */
  readonly prompt: PromptParts;
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
  /** Pull requests, issues and CI runs of the virtual GitHub. */
  readonly github: GitHub;
  /** The web interface of the virtual GitHub, also used to query pull request statuses. */
  readonly gitHubActions: GitHubActions;

  // The active workstation, kept flat because nearly every component reads it.
  readonly workspace: Workspace;
  readonly entries: readonly TerminalEntry[];
  readonly commandHistory: readonly string[];
  readonly lastResult: CommandResult | null;
  readonly showWelcome: boolean;

  readonly run: (commandLine: string) => void;
  readonly complete: (commandLine: string) => Completion;
  readonly clear: () => void;
  /** Writes a file on the active workstation, like a text editor would. */
  readonly saveFile: (path: string, content: string) => FileWriteProblem | null;
  readonly switchUser: (userId: string) => void;
  /** Creates a teammate with an empty workstation, or tells why the name is refused. */
  readonly addUser: (name: string) => UserNameProblem | null;
  /** Performs an action on the virtual GitHub as the active user, or tells why it is refused. */
  readonly act: (
    perform: (actions: GitHubActions, state: HostingState) => HostingState,
  ) => GitHubProblem | null;
  /** Starts over with the initial team, empty workstations and repositories. */
  readonly reset: () => void;
  /** Types each command in the terminal of its teammate, switching workstation as needed. */
  readonly play: (steps: readonly ScriptStep[]) => void;
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

export function createSessionStore(shell: Shell, team: TeamSetup, gitHubActions: GitHubActions) {
  const [firstUser, ...otherUsers] = team.users;
  if (firstUser === undefined) {
    throw new Error('A session needs at least one user');
  }
  let nextId = 1;
  const initialState = () => ({
    users: team.users,
    network: team.network,
    github: team.github,
    otherWorkstations: Object.fromEntries(
      otherUsers.map((user) => [user.id, createWorkstation(user)]),
    ),
    ...flatten(createWorkstation(firstUser)),
  });

  return createStore<SessionState>()((set, get) => ({
    ...initialState(),
    gitHubActions,

    run(commandLine) {
      const trimmed = commandLine.trim();
      if (trimmed === 'clear') {
        get().clear();
        set((state) => ({ commandHistory: [...state.commandHistory, trimmed] }));
        return;
      }

      const { workspace, commandHistory, entries, network, github } = get();
      const result = shell.execute(trimmed, workspace, network);
      // A push reaches GitHub, which runs the CI workflow on the branches it moved.
      const hosting =
        result.network === undefined
          ? { network, github }
          : runWorkflows({ network: result.network, github }, network);
      const entry: TerminalEntry = {
        id: nextId,
        prompt: describePrompt(workspace),
        commandLine: trimmed,
        output: result.output,
        exitCode: result.exitCode,
        explanation: result.explanation,
      };
      nextId += 1;

      set({
        workspace: result.workspace,
        network: hosting.network,
        github: hosting.github,
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

    saveFile(path, content) {
      const { workspace } = get();
      const problem = findFileWriteProblem(workspace, path);
      if (problem === null) {
        set({ workspace: writeFile(workspace, path, content) });
      }
      return problem;
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

    act(perform) {
      const { network, github } = get();
      const result = runGitHubAction({ network, github }, (state) => perform(gitHubActions, state));
      if (!result.ok) {
        return result.problem;
      }
      set({ network: result.state.network, github: result.state.github });
      return null;
    },

    reset() {
      set(initialState());
    },

    play(steps) {
      steps.forEach(({ userId, commandLine }) => {
        if (get().activeUser.id !== userId) {
          get().switchUser(userId);
        }
        get().run(commandLine);
      });
    },
  }));
}
