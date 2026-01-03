import { describe, it, expect } from "vitest";
import { bindValue, BindValue } from "../../src/bindValue.js";

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

describe("bindValue basics", () => {
  describe("instance creation", () => {
    it("creates BindValue instance", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding).toBeInstanceOf(BindValue);
    });
  });

  describe("getValue()", () => {
    it("returns defaultValue when key doesn't exist", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding.getValue()).toBe("default");
    });

    it("returns current value", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "existing value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding.getValue()).toBe("existing value");
    });
  });

  describe("set()", () => {
    it("updates mockStorage", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("new value");

      expect(mockStorage.getItem("test")).toBe("new value");
    });

    it("updates internal value", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("new value");

      expect(binding.getValue()).toBe("new value");
    });

    it("overwrites existing value", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("first");
      binding.set("second");
      binding.set("third");

      expect(binding.getValue()).toBe("third");
      expect(mockStorage.getItem("test")).toBe("third");
    });
  });
});
