import '@fontsource/overpass/400.css';
import '@fontsource/overpass/600.css';
import '@fontsource/overpass/700.css';
import '@fontsource/overpass-mono/400.css';
import '@fontsource/overpass-mono/600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createWorkspace } from '@/domain/entities/Workspace';
import { createShell } from '@/infrastructure/shell/Shell';
import { App } from '@/presentation/App';
import { createSessionStore } from '@/presentation/stores/sessionStore';
import '@/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

const store = createSessionStore(
  createShell(),
  createWorkspace('/home/alice/project', { name: 'Alice', email: 'alice@agitz.dev' }),
);

createRoot(rootElement).render(
  <StrictMode>
    <App store={store} />
  </StrictMode>,
);
