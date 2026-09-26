import { createWorkspace } from '@/domain/entities/Workspace';
import { createGitEngine } from '@/infrastructure/git-engine/GitEngine';
import { Sha1ObjectHasher } from '@/infrastructure/git-engine/Sha1ObjectHasher';
import { createShell } from '@/infrastructure/shell/Shell';
import { createSessionStore } from '@/presentation/stores/sessionStore';
import { FakeClock } from '@/test/doubles/FakeClock';

export function createTestSessionStore(commands: readonly string[] = []) {
  const store = createSessionStore(
    createShell(createGitEngine({ hasher: new Sha1ObjectHasher(), clock: new FakeClock() })),
    createWorkspace('/home/alice/project', { name: 'Alice', email: 'alice@example.com' }),
  );
  commands.forEach((command) => {
    store.getState().run(command);
  });
  return store;
}
