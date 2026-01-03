import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { bindValue, BindValue } from "../src/bindValue.js";

describe("bindValue", () => {
  let mockLocalStorage: Map<string, string>;
  let originalLocalStorage: typeof localStorage;

  beforeEach(() => {
    mockLocalStorage = new Map();
    originalLocalStorage = globalThis.localStorage;

    globalThis.localStorage = {
      getItem: (key: string) => mockLocalStorage.get(key) ?? null,
      setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
      get length(): number {
        return mockLocalStorage.size;
      },
      clear(): void {
        mockLocalStorage.clear();
      },
      key(index: number): string | null {
        const keys = Array.from(mockLocalStorage.keys());
        return keys[index] ?? null;
      },
      removeItem(key: string): void {
        mockLocalStorage.delete(key);
      },
    } as Storage;
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it("creates BindValue instance", () => {
    const binding = bindValue({ key: "test" });

    expect(binding).toBeInstanceOf(BindValue);
  });

  it("getValue() returns undefined when key doesn't exist", () => {
    const binding = bindValue({ key: "test" });

    expect(binding.getValue()).toBeUndefined();
  });

  it("getValue() returns current value", () => {
    mockLocalStorage.set("test", "existing value");
    const binding = bindValue({ key: "test" });

    expect(binding.getValue()).toBe("existing value");
  });

  it("set() updates localStorage", () => {
    const binding = bindValue({ key: "test" });

    binding.set("new value");

    expect(mockLocalStorage.get("test")).toBe("new value");
  });

  it("set() updates internal value", () => {
    const binding = bindValue({ key: "test" });

    binding.set("new value");

    expect(binding.getValue()).toBe("new value");
  });

  it("subscribe() returns unsubscribe function", () => {
    const binding = bindValue({ key: "test" });
    const callback = vi.fn();
    const unsubscribe = binding.subscribe(callback);

    expect(typeof unsubscribe).toBe("function");

    unsubscribe();
  });

  it("subscribe() notifies subscribers on set()", () => {
    const binding = bindValue({ key: "test" });
    const callback = vi.fn();

    binding.subscribe(callback);
    binding.set("new value");

    expect(callback).toHaveBeenCalledWith("new value");
  });

  it("unsubscribe() prevents further notifications", () => {
    const binding = bindValue({ key: "test" });
    const callback = vi.fn();

    const unsubscribe = binding.subscribe(callback);
    binding.set("first value");
    unsubscribe();
    binding.set("second value");

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("first value");
  });

  it("multiple subscribers all receive updates", () => {
    const binding = bindValue({ key: "test" });
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    binding.subscribe(callback1);
    binding.subscribe(callback2);
    binding.subscribe(callback3);

    binding.set("new value");

    expect(callback1).toHaveBeenCalledWith("new value");
    expect(callback2).toHaveBeenCalledWith("new value");
    expect(callback3).toHaveBeenCalledWith("new value");
  });

  it("set() overwrites existing value", () => {
    const binding = bindValue({ key: "test" });

    binding.set("first");
    binding.set("second");
    binding.set("third");

    expect(binding.getValue()).toBe("third");
    expect(mockLocalStorage.get("test")).toBe("third");
  });

  it("subscribe() does not call callback immediately", () => {
    const binding = bindValue({ key: "test" });
    const callback = vi.fn();

    binding.subscribe(callback);

    expect(callback).not.toHaveBeenCalled();
  });

  it("subscribe() calls callback only on value change", () => {
    const binding = bindValue({ key: "test" });
    const callback = vi.fn();

    binding.subscribe(callback);
    expect(callback).not.toHaveBeenCalled();

    binding.set("new value");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("new value");
  });
});
