export interface BindValueOptions {
  key: string;
}

export class BindValue {
  private value: string | undefined;
  private subscribers: Set<(value: string | undefined) => void>;

  constructor(private options: BindValueOptions) {
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
    const value = localStorage.getItem(this.options.key);
    return value !== null ? value : undefined;
  }

  private saveToStorage(value: string): void {
    localStorage.setItem(this.options.key, value);
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
