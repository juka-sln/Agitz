import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MISSION_IDS, type MissionId } from '@/application/learning/missions';

interface ProgressState {
  /** When each mission was accomplished, as an ISO date. Kept when the session starts over. */
  readonly completedAt: Partial<Record<MissionId, string>>;
  /** Badges earned since the learner last dismissed the announcement; never saved. */
  readonly justEarned: readonly MissionId[];
  readonly record: (missions: readonly MissionId[], at: string) => void;
  readonly dismiss: () => void;
  readonly resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedAt: {},
      justEarned: [],
      record: (missions, at) => {
        set((state) => ({
          completedAt: {
            ...state.completedAt,
            ...Object.fromEntries(missions.map((mission) => [mission, at])),
          },
          justEarned: [...state.justEarned, ...missions],
        }));
      },
      dismiss: () => {
        set({ justEarned: [] });
      },
      resetProgress: () => {
        set({ completedAt: {}, justEarned: [] });
      },
    }),
    {
      name: 'agitz.progress',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ completedAt: state.completedAt }),
    },
  ),
);

/** Missions accomplished so far, ignoring any unknown id left by an older version. */
export function selectCompletedMissions(state: Pick<ProgressState, 'completedAt'>): MissionId[] {
  return MISSION_IDS.filter((mission) => state.completedAt[mission] !== undefined);
}
