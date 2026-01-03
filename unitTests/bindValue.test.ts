import { describe, it, expect, vi } from "vitest";
import { bindValue, BindValue } from "../src/bindValue.js";

function createMockStorage(): Storage {
  const mockStorage = new Map<string, string>();

  return {
    get length() {
      return mockStorage.size;
    },
    clear() {
      mockStorage.clear();
    },
    getItem(key: string) {
      return mockStorage.get(key) ?? null;
    },
    key(index: number) {
      const keys = Array.from(mockStorage.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      mockStorage.delete(key);
    },
    setItem(key: string, value: string) {
      mockStorage.set(key, value);
    },
  };
}

describe("bindValue", () => {
  describe("with mock storage", () => {
    it("creates BindValue instance", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });

      expect(binding).toBeInstanceOf(BindValue);
    });

    it("getValue() returns undefined when key doesn't exist", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });

      expect(binding.getValue()).toBeUndefined();
    });

    it("getValue() returns current value", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "existing value");
      const binding = bindValue({ key: "test", storage: mockStorage });

      expect(binding.getValue()).toBe("existing value");
    });

    it("set() updates mockStorage", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });

      binding.set("new value");

      expect(mockStorage.getItem("test")).toBe("new value");
    });

    it("set() updates internal value", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });

      binding.set("new value");

      expect(binding.getValue()).toBe("new value");
    });

    it("subscribe() returns unsubscribe function", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
      const callback = vi.fn();
      const unsubscribe = binding.subscribe(callback);

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();
    });

    it("subscribe() notifies subscribers on set()", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
      const callback = vi.fn();

      binding.subscribe(callback);
      binding.set("new value");

      expect(callback).toHaveBeenCalledWith("new value");
    });

    it("unsubscribe() prevents further notifications", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
      const callback = vi.fn();

      const unsubscribe = binding.subscribe(callback);
      binding.set("first value");
      unsubscribe();
      binding.set("second value");

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first value");
    });

    it("multiple subscribers all receive updates", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
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
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });

      binding.set("first");
      binding.set("second");
      binding.set("third");

      expect(binding.getValue()).toBe("third");
      expect(mockStorage.getItem("test")).toBe("third");
    });

    it("subscribe() does not call callback immediately", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
      const callback = vi.fn();

      binding.subscribe(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("subscribe() calls callback only on value change", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue({ key: "test", storage: mockStorage });
      const callback = vi.fn();

      binding.subscribe(callback);
      expect(callback).not.toHaveBeenCalled();

      binding.set("new value");
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("new value");
    });
  });

  describe("with in-memory storage", () => {
    it("works without storage parameter", () => {
      const binding = bindValue({ key: "test" });

      expect(binding).toBeInstanceOf(BindValue);
      expect(binding.getValue()).toBeUndefined();
    });

    it("works with explicit undefined", () => {
      const binding = bindValue({ key: "test", storage: undefined });

      expect(binding).toBeInstanceOf(BindValue);
      expect(binding.getValue()).toBeUndefined();
    });

    it("set() updates value", () => {
      const binding = bindValue({ key: "test" });

      binding.set("new value");

      expect(binding.getValue()).toBe("new value");
    });

    it("subscribe() works with in-memory storage", () => {
      const binding = bindValue({ key: "test" });
      const callback = vi.fn();

      binding.subscribe(callback);
      binding.set("new value");

      expect(callback).toHaveBeenCalledWith("new value");
    });

    it("data persists across instances with same key", () => {
      const binding1 = bindValue({ key: "shared-key" });
      binding1.set("shared value");

      const binding2 = bindValue({ key: "shared-key" });
      expect(binding2.getValue()).toBe("shared value");
    });

    it("data does not mix between different keys", () => {
      const binding1 = bindValue({ key: "key1" });
      const binding2 = bindValue({ key: "key2" });

      binding1.set("value1");
      binding2.set("value2");

      expect(binding1.getValue()).toBe("value1");
      expect(binding2.getValue()).toBe("value2");
    });
  });
});
