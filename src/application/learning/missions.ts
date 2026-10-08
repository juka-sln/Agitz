import type { GitHub } from '@/domain/entities/GitHub';
import {
  findHostedRepository,
  hostedRepositoryUrls,
  type Network,
} from '@/domain/entities/Network';
import type { Repository } from '@/domain/entities/Repository';
import type { Workspace } from '@/domain/entities/Workspace';
import { isAncestor } from '@/domain/services/history';
import { commitSubject } from '@/domain/value-objects/CommitMessage';
import { isConventionalHeader, isGeneratedHeader } from '@/domain/value-objects/ConventionalCommit';

/** A command typed in a terminal, as the missions need to know it. */
export interface CommandRecord {
  readonly commandLine: string;
  readonly exitCode: number;
  readonly output: string;
}

export interface LearnerWorkstation {
  readonly workspace: Workspace;
  /** What is still on screen in this terminal, oldest first. */
  readonly commands: readonly CommandRecord[];
}

/** Everything the learner has done so far, on every workstation and on the virtual GitHub. */
export interface LearningState {
  readonly workstations: readonly LearnerWorkstation[];
  readonly network: Network;
  readonly github: GitHub;
}

export const MISSION_IDS = [
  'first-commit',
  'conventional-commit',
  'branch-out',
  'merge-branches',
  'undo-change',
  'stash-work',
  'tag-release',
  'rebase-branch',
  'push-to-github',
  'work-as-a-team',
  'resolve-conflict',
  'merge-pull-request',
] as const;

export type MissionId = (typeof MISSION_IDS)[number];

export interface Mission {
  readonly id: MissionId;
  /** The documentation page that teaches what the mission needs. */
  readonly docId: string;
  readonly isDone: (state: LearningState) => boolean;
}

function repositories(state: LearningState): Repository[] {
  return state.workstations.flatMap(({ workspace }) =>
    workspace.repository === null ? [] : [workspace.repository],
  );
}

function someCommit(state: LearningState, matches: (subject: string, parents: number) => boolean) {
  return repositories(state).some((repository) =>
    Object.values(repository.commits).some((commit) =>
      matches(commitSubject(commit.message), commit.parents.length),
    ),
  );
}

function succeeded(state: LearningState, pattern: RegExp): boolean {
  return state.workstations.some(({ commands }) =>
    commands.some((command) => command.exitCode === 0 && pattern.test(command.commandLine)),
  );
}

/** Two branches that went separate ways: one holds work the other cannot reach. */
function hasDivergingBranch(repository: Repository): boolean {
  const tips = Object.values(repository.branches);
  return tips.some((tip) => tips.some((other) => !isAncestor(repository, tip, other)));
}

function concludedAfterConflict({ workspace, commands }: LearnerWorkstation): boolean {
  // Not concluded while the merge, rebase or cherry-pick is still waiting.
  if (workspace.repository?.operation !== null) {
    return false;
  }
  const conflict = commands.findLastIndex((command) => command.output.includes('CONFLICT ('));
  return (
    conflict !== -1 &&
    commands
      .slice(conflict + 1)
      .some(
        (command) =>
          command.exitCode === 0 &&
          /^git\s+(commit|(merge|rebase|cherry-pick|revert)\s+--continue)\b/.test(
            command.commandLine,
          ),
      )
  );
}

function hostedAuthors(network: Network): Set<string>[] {
  return hostedRepositoryUrls(network).map((url) => {
    const commits = Object.values(findHostedRepository(network, url)?.commits ?? {});
    return new Set(commits.map((commit) => commit.author.email));
  });
}

/** Missions in the order of the course: each one builds on the ones before. */
export const MISSIONS: readonly Mission[] = [
  {
    id: 'first-commit',
    docId: 'commit',
    isDone: (state) => repositories(state).some((repo) => Object.keys(repo.commits).length > 0),
  },
  {
    id: 'conventional-commit',
    docId: 'commit-messages',
    isDone: (state) =>
      someCommit(state, (subject) => isConventionalHeader(subject) && !isGeneratedHeader(subject)),
  },
  {
    id: 'branch-out',
    docId: 'branch',
    isDone: (state) => repositories(state).some(hasDivergingBranch),
  },
  {
    id: 'merge-branches',
    docId: 'merge',
    isDone: (state) => someCommit(state, (_subject, parents) => parents > 1),
  },
  {
    id: 'undo-change',
    docId: 'revert',
    isDone: (state) => succeeded(state, /^git\s+(revert|reset)\s+\S/),
  },
  {
    id: 'stash-work',
    docId: 'stash',
    isDone: (state) => succeeded(state, /^git\s+stash\s+(pop|apply)\b/),
  },
  {
    id: 'tag-release',
    docId: 'semver',
    isDone: (state) =>
      repositories(state).some((repo) =>
        Object.keys(repo.tags).some((name) => /^v?\d+\.\d+\.\d+$/.test(name)),
      ),
  },
  {
    id: 'rebase-branch',
    docId: 'rebase',
    isDone: (state) =>
      state.workstations.some(({ commands }) =>
        commands.some(
          (command) =>
            command.exitCode === 0 && command.output.includes('Successfully rebased and updated'),
        ),
      ),
  },
  {
    id: 'push-to-github',
    docId: 'push',
    isDone: (state) =>
      hostedRepositoryUrls(state.network).some(
        (url) => Object.keys(findHostedRepository(state.network, url)?.branches ?? {}).length > 0,
      ),
  },
  {
    id: 'work-as-a-team',
    docId: 'github-collaboration',
    isDone: (state) => hostedAuthors(state.network).some((authors) => authors.size > 1),
  },
  {
    id: 'resolve-conflict',
    docId: 'resolving-conflicts',
    isDone: (state) => state.workstations.some(concludedAfterConflict),
  },
  {
    id: 'merge-pull-request',
    docId: 'github-collaboration',
    isDone: (state) => state.github.pullRequests.some((pull) => pull.state === 'merged'),
  },
];

/** The missions accomplished in this state, among those not done yet. */
export function findAccomplishedMissions(
  state: LearningState,
  alreadyDone: ReadonlySet<MissionId>,
): MissionId[] {
  return MISSIONS.filter((mission) => !alreadyDone.has(mission.id) && mission.isDone(state)).map(
    (mission) => mission.id,
  );
}
