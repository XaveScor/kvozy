import { describe, it, expect } from "vitest";
import { bindJSONValue } from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

interface User {
  name: string;
  age: number;
}

describe("bindJSONValue", () => {
  describe("basic functionality", () => {
    it("works with objects", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<User>({
        key: "user",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
      });

      expect(binding.getValue()).toEqual({ name: "", age: 0 });
      binding.set({ name: "John", age: 30 });
      expect(binding.getValue()).toEqual({ name: "John", age: 30 });
    });

    it("persists to storage as JSON string", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<User>({
        key: "user",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
      });

      binding.set({ name: "John", age: 30 });
      expect(mockStorage.getItem("user")).toBe('{"name":"John","age":30}');
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("user", '{"name":"Jane","age":25}');
      const binding = bindJSONValue<User>({
        key: "user",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
      });

      expect(binding.getValue()).toEqual({ name: "Jane", age: 25 });
    });

    it("works with arrays", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<string[]>({
        key: "tags",
        defaultValue: [],
        storage: mockStorage,
      });

      expect(binding.getValue()).toEqual([]);
      binding.set(["tag1", "tag2", "tag3"]);
      expect(binding.getValue()).toEqual(["tag1", "tag2", "tag3"]);
    });
  });

  describe("nested structures", () => {
    it("handles nested objects", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<{
        user: { name: string; address: { city: string } };
      }>({
        key: "complex",
        defaultValue: { user: { name: "", address: { city: "" } } },
        storage: mockStorage,
      });

      binding.set({
        user: { name: "John", address: { city: "New York" } },
      });
      expect(binding.getValue()).toEqual({
        user: { name: "John", address: { city: "New York" } },
      });
    });

    it("handles nested arrays", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<number[][]>({
        key: "matrix",
        defaultValue: [],
        storage: mockStorage,
      });

      binding.set([
        [1, 2],
        [3, 4],
      ]);
      expect(binding.getValue()).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe("null handling", () => {
    it("handles null defaultValue", () => {
      const mockStorage = createMockStorage();
      const binding = bindJSONValue<null | { data: string }>({
        key: "nullable",
        defaultValue: null,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(null);
      binding.set({ data: "test" });
      expect(binding.getValue()).toEqual({ data: "test" });
    });
  });

  describe("versioning", () => {
    it("supports versioned storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", '\x001.0.0\x00{"name":"John"}');
      const binding = bindJSONValue<{ name: string }>({
        key: "test",
        defaultValue: { name: "" },
        storage: mockStorage,
        version: "1.0.0",
      });

      expect(binding.getValue()).toEqual({ name: "John" });
    });

    it("migrates between object shapes", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", '\x000.9.0\x00{"name":"John"}');
      const binding = bindJSONValue<{ name: string; age: number }>({
        key: "test",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          const oldData = JSON.parse(old) as { name: string };
          return { name: oldData.name, age: 0 };
        },
      });

      expect(binding.getValue()).toEqual({ name: "John", age: 0 });
      expect(mockStorage.getItem("test")).toBe(
        '\x001.0.0\x00{"name":"John","age":0}',
      );
    });
  });
});
