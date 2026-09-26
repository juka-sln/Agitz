import { useContext } from 'react';
import { useStore } from 'zustand';

import { SessionContext } from '../stores/sessionContext';
import type { SessionState } from '../stores/sessionStore';

export function useSession<T>(selector: (state: SessionState) => T): T {
  const store = useContext(SessionContext);
  if (!store) {
    throw new Error('useSession must be used inside a SessionProvider');
  }
  return useStore(store, selector);
}
