import type { StorageSlot } from '@/infrastructure/persistence/localStorageSlot';

import { takeSnapshot, type SessionSnapshot } from './sessionSnapshot';
import type { SessionStore } from './sessionStore';

/** Long enough to save once for a burst of commands, such as a scripted scenario. */
const SAVE_DELAY_MS = 400;

/** Saves the session shortly after every change, and right away when the page is left. */
export function persistSession(
  store: SessionStore,
  slot: StorageSlot<SessionSnapshot>,
  target: Pick<Window, 'addEventListener' | 'removeEventListener'> = window,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer === null) {
      return;
    }
    clearTimeout(timer);
    timer = null;
    slot.save(takeSnapshot(store.getState()));
  };

  const unsubscribe = store.subscribe(() => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      slot.save(takeSnapshot(store.getState()));
    }, SAVE_DELAY_MS);
  });
  target.addEventListener('pagehide', flush);

  return () => {
    flush();
    unsubscribe();
    target.removeEventListener('pagehide', flush);
  };
}
