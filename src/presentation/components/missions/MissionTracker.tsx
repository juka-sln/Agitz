import { useContext, useEffect } from 'react';

import { findAccomplishedMissions } from '@/application/learning/missions';

import { toLearningState } from '../../stores/learningState';
import { selectCompletedMissions, useProgressStore } from '../../stores/progressStore';
import { SessionContext } from '../../stores/sessionContext';

import { BadgeToast } from './BadgeToast';

/** Checks the missions after every change of the session and announces the badges earned. */
export function MissionTracker() {
  const store = useContext(SessionContext);

  useEffect(() => {
    if (store === null) {
      return undefined;
    }
    const check = () => {
      const progress = useProgressStore.getState();
      const accomplished = findAccomplishedMissions(
        toLearningState(store.getState()),
        new Set(selectCompletedMissions(progress)),
      );
      if (accomplished.length > 0) {
        progress.record(accomplished, new Date().toISOString());
      }
    };
    check();
    return store.subscribe(check);
  }, [store]);

  return <BadgeToast />;
}
