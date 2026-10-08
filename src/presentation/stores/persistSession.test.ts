import type { StorageSlot } from '@/infrastructure/persistence/localStorageSlot';
import { createTestSessionStore } from '@/test/fixtures/createTestSessionStore';

import { persistSession } from './persistSession';
import type { SessionSnapshot } from './sessionSnapshot';

function memorySlot() {
  const saves: SessionSnapshot[] = [];
  const slot: StorageSlot<SessionSnapshot> = {
    load: () => saves.at(-1) ?? null,
    save: (value) => {
      saves.push(value);
      return true;
    },
    clear: () => undefined,
  };
  return { slot, saves };
}

describe('persistSession', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves once after a burst of changes', () => {
    const store = createTestSessionStore();
    const { slot, saves } = memorySlot();
    persistSession(store, slot, new EventTarget());

    store.getState().run('git init');
    store.getState().run('echo hi > a.txt');
    expect(saves).toHaveLength(0);

    vi.runAllTimers();
    expect(saves).toHaveLength(1);
    expect(saves[0]?.workstations[0]?.workspace.files).toEqual({ 'a.txt': 'hi\n' });
  });

  it('saves pending changes right away when the page is left', () => {
    const store = createTestSessionStore();
    const { slot, saves } = memorySlot();
    const page = new EventTarget();
    persistSession(store, slot, page);

    store.getState().run('git init');
    page.dispatchEvent(new Event('pagehide'));

    expect(saves).toHaveLength(1);
    vi.runAllTimers();
    expect(saves).toHaveLength(1);
  });

  it('stops listening once stopped', () => {
    const store = createTestSessionStore();
    const { slot, saves } = memorySlot();
    const stop = persistSession(store, slot, new EventTarget());
    stop();

    store.getState().run('git init');
    vi.runAllTimers();
    expect(saves).toHaveLength(0);
  });
});
