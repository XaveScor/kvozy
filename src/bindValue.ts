export interface BindValueOptions<T> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string;
  deserialize: (serialized: string) => T;
  storage?: Storage;
  version?: string;
  migrate?: (oldSerialized: string, oldVersion: string | undefined) => T;
}

export interface BindValueNSOptions<T> {
  prefix: string;
  defaultValue: T;
  serialize: (value: T) => string;
  deserialize: (serialized: string) => T;
  storage?: Storage;
  version?: string;
  migrate?: (oldSerialized: string, oldVersion: string | undefined) => T;
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

  getRaw(): string | null {
    return this.storage.getItem(this.options.key);
  }

  setRaw(rawValue: string): void {
    let deserializedValue: T;
    const version = this.options.version;
    let serializedPart: string;

    if (version) {
      if (!rawValue.startsWith("\x00")) {
        return;
      }

      const parts = rawValue.split("\x00");
      if (parts.length < 3) {
        return;
      }

      const versionPart = parts[1];
      if (versionPart !== version) {
        return;
      }

      serializedPart = parts.slice(2).join("\x00");
    } else {
      serializedPart = rawValue;
    }

    try {
      deserializedValue = this.options.deserialize(serializedPart);
    } catch {
      return;
    }
    const serializedValue = this.options.serialize(deserializedValue);
    let reconstructedRaw: string;

    if (version) {
      reconstructedRaw = `\x00${version}\x00${serializedValue}`;
    } else {
      reconstructedRaw = serializedValue;
    }

    if (reconstructedRaw !== rawValue) {
      return;
    }

    this.storage.setItem(this.options.key, rawValue);
    this.value = deserializedValue;
    this.notifySubscribers();
  }

  private loadFromStorage(): T {
    const rawValue = this.storage.getItem(this.options.key);

    if (rawValue === null) {
      return this.options.defaultValue;
    }

    let oldVersion: string | undefined;
    let serializedValue: string;

    if (rawValue.startsWith("\x00")) {
      const parts = rawValue.split("\x00");
      if (parts.length >= 3) {
        oldVersion = parts[1];
        serializedValue = parts.slice(2).join("\x00");
      } else {
        serializedValue = rawValue;
      }
    } else {
      serializedValue = rawValue;
    }

    const currentVersion = this.options.version;

    if (oldVersion !== currentVersion) {
      if (this.options.migrate) {
        try {
          const migratedValue = this.options.migrate(
            serializedValue,
            oldVersion,
          );
          this.saveToStorage(migratedValue);
          return migratedValue;
        } catch {
          this.storage.removeItem(this.options.key);
          return this.options.defaultValue;
        }
      } else {
        this.storage.removeItem(this.options.key);
        return this.options.defaultValue;
      }
    }

    try {
      return this.options.deserialize(serializedValue);
    } catch {
      return this.options.defaultValue;
    }
  }

  private saveToStorage(value: T): void {
    try {
      const serialized = this.options.serialize(value);
      const version = this.options.version;

      if (version) {
        this.storage.setItem(
          this.options.key,
          `\x00${version}\x00${serialized}`,
        );
      } else {
        this.storage.setItem(this.options.key, serialized);
      }
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

export function _clearInMemoryStorage(): void {
  memoryStorage.clear();
}

export class BindValueNS<T> {
  constructor(private options: BindValueNSOptions<T>) {
    if (!this.options.prefix || this.options.prefix.trim() === "") {
      throw new Error("Prefix cannot be empty");
    }
  }

  bind(key: string): BindValue<T> {
    if (!key || key.trim() === "") {
      throw new Error("Key cannot be empty");
    }

    return new BindValue<T>({
      key: `${this.options.prefix}\x1F${key}`,
      defaultValue: this.options.defaultValue,
      serialize: this.options.serialize,
      deserialize: this.options.deserialize,
      storage: this.options.storage,
      version: this.options.version,
      migrate: this.options.migrate,
    });
  }
}

export function bindValueNS<T>(options: BindValueNSOptions<T>): BindValueNS<T> {
  return new BindValueNS(options);
}
