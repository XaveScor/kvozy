export interface BindValueOptions<T> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string;
  deserialize: (serialized: string) => T;
  storage?: Storage;
}

const memoryStorage = new Map<string, string>();

const inMemoryStorage: Storage = {
  get length() {
    return memoryStorage.size;
  },
  clear() {
    memoryStorage.clear();
  },
  getItem(key: string) {
    return memoryStorage.get(key) ?? null;
  },
  key(index: number) {
    const keys = Array.from(memoryStorage.keys());
    return keys[index] ?? null;
  },
  removeItem(key: string) {
    memoryStorage.delete(key);
  },
  setItem(key: string, value: string) {
    memoryStorage.set(key, value);
  },
};

export class BindValue<T> {
  private value: T;
  private subscribers: Set<(value: T) => void>;
  private storage: Storage;

  constructor(private options: BindValueOptions<T>) {
    this.storage = options.storage ?? inMemoryStorage;
    this.subscribers = new Set();
    this.value = this.loadFromStorage();
  }

  getValue(): T {
    return this.value;
  }

  set(newValue: T): void {
    this.value = newValue;
    this.saveToStorage(newValue);
    this.notifySubscribers();
  }

  subscribe(callback: (value: T) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private loadFromStorage(): T {
    const rawValue = this.storage.getItem(this.options.key);

    if (rawValue === null) {
      return this.options.defaultValue;
    }

    try {
      return this.options.deserialize(rawValue);
    } catch {
      return this.options.defaultValue;
    }
  }

  private saveToStorage(value: T): void {
    try {
      const serialized = this.options.serialize(value);
      this.storage.setItem(this.options.key, serialized);
    } catch {}
  }

  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.value);
    }
  }
}

export function bindValue<T>(options: BindValueOptions<T>): BindValue<T> {
  return new BindValue(options);
}
