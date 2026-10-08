import type { LearnerWorkstation, LearningState } from '@/application/learning/missions';

import type { SessionState, Workstation } from './sessionStore';

function toLearner({ workspace, entries }: Pick<Workstation, 'workspace' | 'entries'>) {
  return { workspace, commands: entries } satisfies LearnerWorkstation;
}

/** What the missions look at: every workstation, the active one included, and GitHub. */
export function toLearningState(state: SessionState): LearningState {
  return {
    workstations: [toLearner(state), ...Object.values(state.otherWorkstations).map(toLearner)],
    network: state.network,
    github: state.github,
  };
}
