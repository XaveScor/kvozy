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

const createFailingSerializer = () => {
  return (value: any) => {
    if (value.hasCycle || value.hasFunction || value.nonSerializable) {
      throw new Error("Cannot serialize");
    }
    return JSON.stringify(value);
  };
};

describe("bindValue error handling", () => {
  describe("deserialize failure", () => {
    it("returns defaultValue when deserialize fails", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "invalid json");

      const binding = bindValue<{ data: string }>({
        key: "test",
        defaultValue: { data: "default" },
        storage: mockStorage,
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      });

      expect(binding.getValue()).toEqual({ data: "default" });
    });
  });

  describe("serialize failure", () => {
    it("keeps in-memory value when serialize fails", () => {
      const mockStorage = createMockStorage();
      const failingSerialize = createFailingSerializer();

      const binding = bindValue<{
        data: string;
        nonSerializable?: boolean;
      }>({
        key: "test",
        defaultValue: { data: "default" },
        storage: mockStorage,
        serialize: failingSerialize,
        deserialize: (s) => JSON.parse(s),
      });

      binding.set({ data: "value", nonSerializable: true });
      expect(binding.getValue()).toEqual({
        data: "value",
        nonSerializable: true,
      });
      expect(mockStorage.getItem("test")).toBeNull();
    });

    it("handles non-serializable values gracefully, then successfully stores serializable value", () => {
      const mockStorage = createMockStorage();
      const failingSerialize = createFailingSerializer();

      const binding = bindValue<{
        data: string;
        hasCycle?: boolean;
        hasFunction?: boolean;
      }>({
        key: "test",
        defaultValue: { data: "default" },
        storage: mockStorage,
        serialize: failingSerialize,
        deserialize: (s) => JSON.parse(s),
      });

      binding.set({ data: "value1", hasCycle: true });
      expect(binding.getValue()).toEqual({ data: "value1", hasCycle: true });
      expect(mockStorage.getItem("test")).toBeNull();

      binding.set({ data: "value2", hasFunction: true });
      expect(binding.getValue()).toEqual({ data: "value2", hasFunction: true });
      expect(mockStorage.getItem("test")).toBeNull();

      binding.set({ data: "value3" });
      expect(binding.getValue()).toEqual({ data: "value3" });
      expect(mockStorage.getItem("test")).toBe(
        JSON.stringify({ data: "value3" }),
      );
    });

    it("handles always-throwing serialize function", () => {
      const mockStorage = createMockStorage();
      const alwaysThrow = () => {
        throw new Error("Always fails");
      };

      const binding = bindValue<{ data: string }>({
        key: "test",
        defaultValue: { data: "default" },
        storage: mockStorage,
        serialize: alwaysThrow,
        deserialize: (s) => JSON.parse(s),
      });

      binding.set({ data: "new value" });
      expect(binding.getValue()).toEqual({ data: "new value" });
      expect(mockStorage.getItem("test")).toBeNull();
    });
  });
});
