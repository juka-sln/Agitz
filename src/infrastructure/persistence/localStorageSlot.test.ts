import { createLocalStorageSlot } from './localStorageSlot';

function isCounter(value: unknown): value is { count: number } {
  return typeof value === 'object' && value !== null && 'count' in value;
}

describe('createLocalStorageSlot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves, loads and clears a value', () => {
    const slot = createLocalStorageSlot('test.counter', isCounter);

    expect(slot.load()).toBeNull();
    expect(slot.save({ count: 2 })).toBe(true);
    expect(slot.load()).toEqual({ count: 2 });

    slot.clear();
    expect(slot.load()).toBeNull();
  });

  it('ignores values that are unreadable or of the wrong shape', () => {
    const slot = createLocalStorageSlot('test.counter', isCounter);

    localStorage.setItem('test.counter', '{not json');
    expect(slot.load()).toBeNull();

    localStorage.setItem('test.counter', '{"total":3}');
    expect(slot.load()).toBeNull();
  });

  it('reports a failed save instead of throwing', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    const slot = createLocalStorageSlot('test.counter', isCounter);

    expect(slot.save({ count: 1 })).toBe(false);
    expect(createLocalStorageSlot('test.counter', isCounter, null).save({ count: 1 })).toBe(false);
  });
});
