import type { GitHub } from '@/domain/entities/GitHub';
import type { Network } from '@/domain/entities/Network';
import type { SimulatedUser } from '@/domain/entities/SimulatedUser';

import type { SessionState, Workstation } from './sessionStore';

/** Bumped whenever the saved shape changes, so an older save is ignored instead of misread. */
export const SESSION_SNAPSHOT_VERSION = 1;

/** A workstation as saved: the result of the last command only matters while it is on screen. */
export type SavedWorkstation = Omit<Workstation, 'lastResult'>;

/** Everything needed to resume a session after the page is reloaded. */
export interface SessionSnapshot {
  readonly version: typeof SESSION_SNAPSHOT_VERSION;
  readonly users: readonly SimulatedUser[];
  readonly activeUserId: string;
  readonly workstations: readonly SavedWorkstation[];
  readonly network: Network;
  readonly github: GitHub;
}

function saveWorkstation(workstation: Workstation): SavedWorkstation {
  const { user, workspace, entries, commandHistory, showWelcome } = workstation;
  return { user, workspace, entries, commandHistory, showWelcome };
}

export function takeSnapshot(state: SessionState): SessionSnapshot {
  const active: Workstation = {
    user: state.activeUser,
    workspace: state.workspace,
    entries: state.entries,
    commandHistory: state.commandHistory,
    lastResult: state.lastResult,
    showWelcome: state.showWelcome,
  };
  return {
    version: SESSION_SNAPSHOT_VERSION,
    users: state.users,
    activeUserId: state.activeUser.id,
    workstations: [active, ...Object.values(state.otherWorkstations)].map(saveWorkstation),
    network: state.network,
    github: state.github,
  };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSavedWorkstation(value: unknown): value is SavedWorkstation {
  return (
    isRecord(value) &&
    isRecord(value.user) &&
    isRecord(value.workspace) &&
    Array.isArray(value.entries) &&
    Array.isArray(value.commandHistory) &&
    typeof value.showWelcome === 'boolean'
  );
}

/** Checks the outline of a save read back from the browser, which may be stale or tampered with. */
export function isSessionSnapshot(value: unknown): value is SessionSnapshot {
  return (
    isRecord(value) &&
    value.version === SESSION_SNAPSHOT_VERSION &&
    Array.isArray(value.users) &&
    typeof value.activeUserId === 'string' &&
    Array.isArray(value.workstations) &&
    value.workstations.every(isSavedWorkstation) &&
    value.workstations.some(
      (workstation: SavedWorkstation) => workstation.user.id === value.activeUserId,
    ) &&
    isRecord(value.network) &&
    isRecord(value.github)
  );
}
