/** One value kept in the browser between visits. */
export interface StorageSlot<T> {
  /** The saved value, or `null` when there is none or it cannot be read back. */
  readonly load: () => T | null;
  /** Returns whether the value was written (the storage may be full or disabled). */
  readonly save: (value: T) => boolean;
  readonly clear: () => void;
}

function browserStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    // Some browsers throw on access when site data is blocked.
    return null;
  }
}

export function createLocalStorageSlot<T>(
  key: string,
  isValid: (value: unknown) => value is T,
  storage: Storage | null = browserStorage(),
): StorageSlot<T> {
  return {
    load() {
      try {
        const text = storage?.getItem(key) ?? null;
        if (text === null) {
          return null;
        }
        const value: unknown = JSON.parse(text);
        return isValid(value) ? value : null;
      } catch {
        return null;
      }
    },
    save(value) {
      if (storage === null) {
        return false;
      }
      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Could not save "${key}"`, error);
        return false;
      }
    },
    clear() {
      try {
        storage?.removeItem(key);
      } catch {
        // Nothing to clear when the storage is unavailable.
      }
    },
  };
}
