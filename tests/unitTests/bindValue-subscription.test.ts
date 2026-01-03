import { describe, it, expect, vi } from "vitest";
import { bindValue } from "../../src/bindValue.js";

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

describe("bindValue subscription", () => {
  describe("subscribe()", () => {
    it("returns unsubscribe function", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();
      const unsubscribe = binding.subscribe(callback);

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();
    });

    it("notifies subscribers on set()", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);
      binding.set("new value");

      expect(callback).toHaveBeenCalledWith("new value");
    });

    it("does not call callback immediately", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("calls callback only on value change", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);
      expect(callback).not.toHaveBeenCalled();

      binding.set("new value");
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("new value");
    });
  });

  describe("unsubscribe()", () => {
    it("prevents further notifications", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      const unsubscribe = binding.subscribe(callback);
      binding.set("first value");
      unsubscribe();
      binding.set("second value");

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first value");
    });
  });

  describe("multiple subscribers", () => {
    it("all receive updates", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
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
  });
});
