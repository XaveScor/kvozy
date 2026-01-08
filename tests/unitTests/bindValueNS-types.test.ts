import { describe, it, expect } from "vitest";
import {
  bindStringValueNS,
  bindNumberValueNS,
  bindBooleanValueNS,
  bindJSONValueNS,
  bindEnumValueNS,
} from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValueNS types", () => {
  describe("bindStringValueNS", () => {
    it("works with default empty string", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("name");
      expect(binding.getValue()).toBe("");
      binding.set("hello");
      expect(binding.getValue()).toBe("hello");
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        defaultValue: "default",
        storage: mockStorage,
      });

      const binding = namespace.bind("name");
      expect(binding.getValue()).toBe("default");
      binding.set("custom");
      expect(binding.getValue()).toBe("custom");
    });

    it("persists to storage as-is", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("text");
      binding.set("hello world");
      expect(mockStorage.getItem("app\x1Ftext")).toBe("hello world");
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Ftext", "retrieved");
      const namespace = bindStringValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("text");
      expect(binding.getValue()).toBe("retrieved");
    });

    it("handles empty string", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("empty");
      binding.set("");
      expect(binding.getValue()).toBe("");
      expect(mockStorage.getItem("app\x1Fempty")).toBe("");
    });

    it("handles unicode characters", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("unicode");
      const unicode = "Hello 世界 🌍";
      binding.set(unicode);
      expect(binding.getValue()).toBe(unicode);
      expect(mockStorage.getItem("app\x1Funicode")).toBe(unicode);
    });
  });

  describe("bindNumberValueNS", () => {
    it("works with default zero", () => {
      const mockStorage = createMockStorage();
      const namespace = bindNumberValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("count");
      expect(binding.getValue()).toBe(0);
      binding.set(5);
      expect(binding.getValue()).toBe(5);
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const namespace = bindNumberValueNS({
        prefix: "app",
        defaultValue: 10,
        storage: mockStorage,
      });

      const binding = namespace.bind("count");
      expect(binding.getValue()).toBe(10);
      binding.set(20);
      expect(binding.getValue()).toBe(20);
    });

    it("handles negative numbers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindNumberValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("temp");
      binding.set(-10);
      expect(binding.getValue()).toBe(-10);
    });

    it("handles decimal numbers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindNumberValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("price");
      binding.set(19.99);
      expect(binding.getValue()).toBe(19.99);
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fcount", "42");
      const namespace = bindNumberValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("count");
      expect(binding.getValue()).toBe(42);
    });
  });

  describe("bindBooleanValueNS", () => {
    it("works with default false", () => {
      const mockStorage = createMockStorage();
      const namespace = bindBooleanValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("enabled");
      expect(binding.getValue()).toBe(false);
      binding.set(true);
      expect(binding.getValue()).toBe(true);
    });

    it("uses custom defaultValue", () => {
      const mockStorage = createMockStorage();
      const namespace = bindBooleanValueNS({
        prefix: "app",
        defaultValue: true,
        storage: mockStorage,
      });

      const binding = namespace.bind("enabled");
      expect(binding.getValue()).toBe(true);
      binding.set(false);
      expect(binding.getValue()).toBe(false);
    });

    it("persists correctly to storage", () => {
      const mockStorage = createMockStorage();
      const namespace = bindBooleanValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("flag");
      binding.set(true);
      expect(mockStorage.getItem("app\x1Fflag")).toBe("true");
      binding.set(false);
      expect(mockStorage.getItem("app\x1Fflag")).toBe("false");
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fflag", "true");
      const namespace = bindBooleanValueNS({
        prefix: "app",
        storage: mockStorage,
      });

      const binding = namespace.bind("flag");
      expect(binding.getValue()).toBe(true);
    });
  });

  describe("bindJSONValueNS", () => {
    it("works with objects", () => {
      const mockStorage = createMockStorage();
      const namespace = bindJSONValueNS<{ name: string; age: number }>({
        prefix: "app",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toEqual({ name: "", age: 0 });
      binding.set({ name: "John", age: 30 });
      expect(binding.getValue()).toEqual({ name: "John", age: 30 });
    });

    it("works with arrays", () => {
      const mockStorage = createMockStorage();
      const namespace = bindJSONValueNS<number[]>({
        prefix: "app",
        defaultValue: [],
        storage: mockStorage,
      });

      const binding = namespace.bind("items");
      binding.set([1, 2, 3]);
      expect(binding.getValue()).toEqual([1, 2, 3]);
    });

    it("persists as JSON string", () => {
      const mockStorage = createMockStorage();
      const namespace = bindJSONValueNS<{ name: string }>({
        prefix: "app",
        defaultValue: { name: "" },
        storage: mockStorage,
      });

      const binding = namespace.bind("data");
      binding.set({ name: "test" });
      expect(mockStorage.getItem("app\x1Fdata")).toBe('{"name":"test"}');
    });

    it("retrieves from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", '{"name":"John","age":30}');
      const namespace = bindJSONValueNS<{ name: string; age: number }>({
        prefix: "app",
        defaultValue: { name: "", age: 0 },
        storage: mockStorage,
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toEqual({ name: "John", age: 30 });
    });
  });

  describe("bindEnumValueNS", () => {
    it("works with string enum", () => {
      type Theme = "light" | "dark" | "auto";
      const mockStorage = createMockStorage();
      const namespace = bindEnumValueNS<Theme>({
        prefix: "app",
        defaultValue: "light",
        storage: mockStorage,
      });

      const binding = namespace.bind("theme");
      expect(binding.getValue()).toBe("light");
      binding.set("dark");
      expect(binding.getValue()).toBe("dark");
    });

    it("works with numeric enum", () => {
      enum Status {
        Pending = 0,
        Active = 1,
        Inactive = 2,
      }
      const mockStorage = createMockStorage();
      const namespace = bindEnumValueNS<Status>({
        prefix: "app",
        defaultValue: Status.Pending,
        storage: mockStorage,
      });

      const binding = namespace.bind("status");
      expect(binding.getValue()).toBe(Status.Pending);
      binding.set(Status.Active);
      expect(binding.getValue()).toBe(Status.Active);
    });

    it("persists string enum correctly", () => {
      type Theme = "light" | "dark" | "auto";
      const mockStorage = createMockStorage();
      const namespace = bindEnumValueNS<Theme>({
        prefix: "app",
        defaultValue: "light",
        storage: mockStorage,
      });

      const binding = namespace.bind("theme");
      binding.set("dark");
      expect(mockStorage.getItem("app\x1Ftheme")).toBe("dark");
    });

    it("persists numeric enum correctly", () => {
      enum Status {
        Pending = 0,
        Active = 1,
      }
      const mockStorage = createMockStorage();
      const namespace = bindEnumValueNS<Status>({
        prefix: "app",
        defaultValue: Status.Pending,
        storage: mockStorage,
      });

      const binding = namespace.bind("status");
      binding.set(Status.Active);
      expect(mockStorage.getItem("app\x1Fstatus")).toBe("1");
    });

    it("retrieves string enum from storage", () => {
      type Theme = "light" | "dark" | "auto";
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Ftheme", "dark");
      const namespace = bindEnumValueNS<Theme>({
        prefix: "app",
        defaultValue: "light",
        storage: mockStorage,
      });

      const binding = namespace.bind("theme");
      expect(binding.getValue()).toBe("dark");
    });

    it("retrieves numeric enum from storage", () => {
      enum Status {
        Pending = 0,
        Active = 1,
      }
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fstatus", "1");
      const namespace = bindEnumValueNS<Status>({
        prefix: "app",
        defaultValue: Status.Pending,
        storage: mockStorage,
      });

      const binding = namespace.bind("status");
      expect(binding.getValue()).toBe(Status.Active);
    });
  });

  describe("versioning support in type helpers", () => {
    it("bindStringValueNS supports versioning", () => {
      const mockStorage = createMockStorage();
      const namespace = bindStringValueNS({
        prefix: "app",
        defaultValue: "default",
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("test");
      binding.set("hello");
      expect(mockStorage.getItem("app\x1Ftest")).toBe("\x001.0.0\x00hello");
    });

    it("bindNumberValueNS supports versioning", () => {
      const mockStorage = createMockStorage();
      const namespace = bindNumberValueNS({
        prefix: "app",
        defaultValue: 0,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("count");
      binding.set(42);
      expect(mockStorage.getItem("app\x1Fcount")).toBe("\x001.0.0\x0042");
    });

    it("bindJSONValueNS supports versioning", () => {
      const mockStorage = createMockStorage();
      const namespace = bindJSONValueNS<{ value: string }>({
        prefix: "app",
        defaultValue: { value: "" },
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("data");
      binding.set({ value: "test" });
      expect(mockStorage.getItem("app\x1Fdata")).toBe(
        '\x001.0.0\x00{"value":"test"}',
      );
    });
  });
});
