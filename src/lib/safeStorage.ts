const isStorageAvailable = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const key = "__storage_test__";
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};

const memoryStorage: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (isStorageAvailable()) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.warn("localStorage.getItem access denied, falling back to memory storage", e);
    }
    return key in memoryStorage ? memoryStorage[key] : null;
  },

  setItem(key: string, value: string): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn("localStorage.setItem access denied, falling back to memory storage", e);
    }
    memoryStorage[key] = String(value);
  },

  removeItem(key: string): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn("localStorage.removeItem access denied, falling back to memory storage", e);
    }
    delete memoryStorage[key];
  },

  clear(): void {
    try {
      if (isStorageAvailable()) {
        window.localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn("localStorage.clear access denied, falling back to memory storage", e);
    }
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};
