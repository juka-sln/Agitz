import { createDefaultTeam } from '@/application/simulation/teamSetup';
import { createGitEngine } from '@/infrastructure/git-engine/GitEngine';
import { Sha1ObjectHasher } from '@/infrastructure/git-engine/Sha1ObjectHasher';
import { createShell } from '@/infrastructure/shell/Shell';
import { createSessionStore } from '@/presentation/stores/sessionStore';
import { FakeClock } from '@/test/doubles/FakeClock';

/** A session with Alice (active) and Bob, sharing an empty repository on the virtual GitHub. */
export function createTestSessionStore(commands: readonly string[] = []) {
  const store = createSessionStore(
    createShell(createGitEngine({ hasher: new Sha1ObjectHasher(), clock: new FakeClock() })),
    createDefaultTeam(),
  );
  commands.forEach((command) => {
    store.getState().run(command);
  });
  return store;
}
