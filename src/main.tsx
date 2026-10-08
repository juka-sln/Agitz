import '@fontsource/overpass/400.css';
import '@fontsource/overpass/600.css';
import '@fontsource/overpass/700.css';
import '@fontsource/overpass-mono/400.css';
import '@fontsource/overpass-mono/600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createGitHubActions } from '@/application/github-features/GitHubActions';
import { createDefaultTeam } from '@/application/simulation/teamSetup';
import { createGitEngine } from '@/infrastructure/git-engine/GitEngine';
import { Sha1ObjectHasher } from '@/infrastructure/git-engine/Sha1ObjectHasher';
import { SystemClock } from '@/infrastructure/git-engine/SystemClock';
import { createLocalStorageSlot } from '@/infrastructure/persistence/localStorageSlot';
import { createShell } from '@/infrastructure/shell/Shell';
import { App } from '@/presentation/App';
import { persistSession } from '@/presentation/stores/persistSession';
import { isSessionSnapshot } from '@/presentation/stores/sessionSnapshot';
import { createSessionStore } from '@/presentation/stores/sessionStore';
import '@/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

const context = { hasher: new Sha1ObjectHasher(), clock: new SystemClock() };
const savedSession = createLocalStorageSlot('agitz.session', isSessionSnapshot);
const store = createSessionStore(
  createShell(createGitEngine(context)),
  createDefaultTeam(),
  createGitHubActions(context),
  savedSession.load(),
);
persistSession(store, savedSession);

createRoot(rootElement).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
