import { describe, it, expect } from "vitest";
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

describe("bindValue type support", () => {
  describe("number type", () => {
    it("works with number type", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<number>({
        key: "counter",
        defaultValue: 0,
        storage: mockStorage,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
      });

      expect(binding.getValue()).toBe(0);
      binding.set(42);
      expect(binding.getValue()).toBe(42);
      expect(mockStorage.getItem("counter")).toBe("42");
    });
  });

  describe("object type", () => {
    it("works with object type", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<{ name: string; age: number }>({
        key: "user",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      });

      expect(binding.getValue()).toEqual({ name: "", age: 0 });
      binding.set({ name: "John", age: 30 });
      expect(binding.getValue()).toEqual({ name: "John", age: 30 });
      expect(mockStorage.getItem("user")).toBe(
        JSON.stringify({ name: "John", age: 30 }),
      );
    });
  });
});
