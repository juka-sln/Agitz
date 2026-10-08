import type { ReactNode } from 'react';

import { SessionContext } from './sessionContext';
import type { SessionStore } from './sessionStore';

export function SessionProvider({ store, children }: { store: SessionStore; children: ReactNode }) {
  return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>;
}
