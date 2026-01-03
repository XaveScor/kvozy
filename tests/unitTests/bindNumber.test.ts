import { describe, it, expect } from "vitest";
import { bindNumberValue } from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("bindNumberValue", () => {
  describe("basic functionality", () => {
    it("works with default zero", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "counter",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(0);
      binding.set(42);
      expect(binding.getValue()).toBe(42);
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "counter",
        defaultValue: 100,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(100);
      binding.set(-50);
      expect(binding.getValue()).toBe(-50);
    });

    it("persists to storage as string", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "number",
        storage: mockStorage,
      });

      binding.set(3.14);
      expect(mockStorage.getItem("number")).toBe("3.14");
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("number", "99");
      const binding = bindNumberValue({
        key: "number",
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(99);
    });
  });

  describe("edge cases", () => {
    it("handles negative numbers", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "negative",
        storage: mockStorage,
      });

      binding.set(-42);
      expect(binding.getValue()).toBe(-42);
      expect(mockStorage.getItem("negative")).toBe("-42");
    });

    it("handles decimal numbers", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "decimal",
        storage: mockStorage,
      });

      binding.set(3.14159);
      expect(binding.getValue()).toBe(3.14159);
      expect(mockStorage.getItem("decimal")).toBe("3.14159");
    });

    it("handles zero", () => {
      const mockStorage = createMockStorage();
      const binding = bindNumberValue({
        key: "zero",
        storage: mockStorage,
      });

      binding.set(0);
      expect(binding.getValue()).toBe(0);
      expect(mockStorage.getItem("zero")).toBe("0");
    });
  });

  describe("versioning", () => {
    it("supports versioned storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x001.0.0\x0042");
      const binding = bindNumberValue({
        key: "test",
        defaultValue: 0,
        storage: mockStorage,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe(42);
    });

    it("migrates old version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00100");
      const binding = bindNumberValue({
        key: "test",
        defaultValue: 0,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("100");
          expect(oldVersion).toBe("0.9.0");
          return 200;
        },
      });

      expect(binding.getValue()).toBe(200);
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00200");
    });
  });
});
