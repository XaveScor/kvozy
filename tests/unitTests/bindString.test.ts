import { describe, it, expect } from "vitest";
import { bindStringValue } from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("bindStringValue", () => {
  describe("basic functionality", () => {
    it("works with default empty string", () => {
      const mockStorage = createMockStorage();
      const binding = bindStringValue({
        key: "name",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe("");
      binding.set("hello");
      expect(binding.getValue()).toBe("hello");
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const binding = bindStringValue({
        key: "name",
        defaultValue: "default",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe("default");
      binding.set("custom");
      expect(binding.getValue()).toBe("custom");
    });

    it("persists to storage as-is", () => {
      const mockStorage = createMockStorage();
      const binding = bindStringValue({
        key: "text",
        storage: mockStorage,
      });

      binding.set("hello world");
      expect(mockStorage.getItem("text")).toBe("hello world");
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("text", "retrieved");
      const binding = bindStringValue({
        key: "text",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe("retrieved");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const mockStorage = createMockStorage();
      const binding = bindStringValue({
        key: "empty",
        storage: mockStorage,
      });

      binding.set("");
      expect(binding.getValue()).toBe("");
      expect(mockStorage.getItem("empty")).toBe("");
    });

    it("handles unicode characters", () => {
      const mockStorage = createMockStorage();
      const binding = bindStringValue({
        key: "unicode",
        storage: mockStorage,
      });

      const unicode = "Hello 世界 🌍";
      binding.set(unicode);
      expect(binding.getValue()).toBe(unicode);
      expect(mockStorage.getItem("unicode")).toBe(unicode);
    });
  });

  describe("versioning", () => {
    it("supports versioned storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x001.0.0\x00hello");
      const binding = bindStringValue({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe("hello");
    });

    it("migrates old version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindStringValue({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("old value");
          expect(oldVersion).toBe("0.9.0");
          return "migrated";
        },
      });

      expect(binding.getValue()).toBe("migrated");
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00migrated");
    });

    it("falls back to default when migrate fails", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindStringValue({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        version: "1.0.0",
        migrate: () => {
          throw new Error("Migration failed");
        },
      });

      expect(binding.getValue()).toBe("default");
      expect(mockStorage.getItem("test")).toBe(null);
    });
  });
});
