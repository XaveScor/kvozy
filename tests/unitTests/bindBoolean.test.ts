import { describe, it, expect } from "vitest";
import { bindBooleanValue } from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("bindBooleanValue", () => {
  describe("basic functionality", () => {
    it("works with default false", () => {
      const mockStorage = createMockStorage();
      const binding = bindBooleanValue({
        key: "enabled",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(false);
      binding.set(true);
      expect(binding.getValue()).toBe(true);
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const binding = bindBooleanValue({
        key: "enabled",
        defaultValue: true,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(true);
      binding.set(false);
      expect(binding.getValue()).toBe(false);
    });

    it("persists true as 'true' string", () => {
      const mockStorage = createMockStorage();
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      binding.set(true);
      expect(mockStorage.getItem("bool")).toBe("true");
    });

    it("persists false as 'false' string", () => {
      const mockStorage = createMockStorage();
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      binding.set(false);
      expect(mockStorage.getItem("bool")).toBe("false");
    });

    it("deserializes 'true' to true", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("bool", "true");
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(true);
    });

    it("deserializes 'false' to false", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("bool", "false");
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles non-true strings as false", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("bool", "yes");
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(false);
    });

    it("handles empty string as false", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("bool", "");
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(false);
    });

    it("handles case-insensitive false", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("bool", "FALSE");
      const binding = bindBooleanValue({
        key: "bool",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(false);
    });
  });

  describe("versioning", () => {
    it("supports versioned storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x001.0.0\x00true");
      const binding = bindBooleanValue({
        key: "test",
        defaultValue: false,
        storage: mockStorage,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe(true);
    });

    it("migrates old version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00false");
      const binding = bindBooleanValue({
        key: "test",
        defaultValue: false,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("false");
          expect(oldVersion).toBe("0.9.0");
          return true;
        },
      });

      expect(binding.getValue()).toBe(true);
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00true");
    });
  });
});
