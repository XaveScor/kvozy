export interface BindValueOptions {
  key: string;
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

export class BindValue {
  private value: string | undefined;
  private subscribers: Set<(value: string | undefined) => void>;
  private storage: Storage;

  constructor(private options: BindValueOptions) {
    this.storage = options.storage ?? inMemoryStorage;
    this.subscribers = new Set();
    this.value = this.loadFromStorage();
  }

  getValue(): string | undefined {
    return this.value;
  }

  set(newValue: string): void {
    this.value = newValue;
    this.saveToStorage(newValue);
    this.notifySubscribers();
  }

  subscribe(callback: (value: string | undefined) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private loadFromStorage(): string | undefined {
    const value = this.storage.getItem(this.options.key);
    return value !== null ? value : undefined;
  }

  private saveToStorage(value: string): void {
    this.storage.setItem(this.options.key, value);
  }

  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      subscriber(this.value);
    }
  }
}

export function bindValue(options: BindValueOptions): BindValue {
  return new BindValue(options);
}
