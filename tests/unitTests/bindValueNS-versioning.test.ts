import { describe, it, expect } from "vitest";
import { bindValueNS } from "../../src/bindValue.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValueNS versioning", () => {
  describe("version support", () => {
    it("stores value with version prefix", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("user");
      binding.set("john");

      expect(mockStorage.getItem("app\x1Fuser")).toBe("\x001.0.0\x00john");
    });

    it("loads versioned value correctly", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x001.0.0\x00john");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("john");
    });

    it("version applies to all bindings in namespace", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      binding1.set("value1");
      binding2.set("value2");

      expect(mockStorage.getItem("app\x1Fkey1")).toBe("\x001.0.0\x00value1");
      expect(mockStorage.getItem("app\x1Fkey2")).toBe("\x001.0.0\x00value2");
    });
  });

  describe("version mismatch without migration", () => {
    it("falls back to default when version mismatches and no migrate function", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("default");
      expect(mockStorage.getItem("app\x1Fuser")).toBeNull();
    });

    it("clears old versioned value when version mismatches", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("user");
      binding.getValue();

      expect(mockStorage.getItem("app\x1Fuser")).toBeNull();
    });

    it("handles unversioned data when version is set", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "unversioned");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("default");
      expect(mockStorage.getItem("app\x1Fuser")).toBeNull();
    });
  });

  describe("migration", () => {
    it("calls migrate function on version mismatch", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old-value");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("old-value");
          expect(oldVersion).toBe("0.9.0");
          return "migrated";
        },
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("migrated");
      expect(mockStorage.getItem("app\x1Fuser")).toBe("\x001.0.0\x00migrated");
    });

    it("stores migrated value with new version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old-value");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old) => `new-${old}`,
      });

      const binding = namespace.bind("user");
      binding.getValue();

      expect(mockStorage.getItem("app\x1Fuser")).toBe(
        "\x001.0.0\x00new-old-value",
      );
    });

    it("falls back to default when migrate throws", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old-value");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: () => {
          throw new Error("Migration failed");
        },
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("default");
      expect(mockStorage.getItem("app\x1Fuser")).toBeNull();
    });

    it("migrates from unversioned data", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "unversioned-data");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("unversioned-data");
          expect(oldVersion).toBeUndefined();
          return "migrated";
        },
      });

      const binding = namespace.bind("user");
      expect(binding.getValue()).toBe("migrated");
    });

    it("migration works for all bindings in namespace", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fkey1", "\x000.9.0\x00value1");
      mockStorage.setItem("app\x1Fkey2", "\x000.9.0\x00value2");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old) => `migrated-${old}`,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      expect(binding1.getValue()).toBe("migrated-value1");
      expect(binding2.getValue()).toBe("migrated-value2");
      expect(mockStorage.getItem("app\x1Fkey1")).toBe(
        "\x001.0.0\x00migrated-value1",
      );
      expect(mockStorage.getItem("app\x1Fkey2")).toBe(
        "\x001.0.0\x00migrated-value2",
      );
    });
  });

  describe("version persistence", () => {
    it("new values after migration keep new version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("app\x1Fuser", "\x000.9.0\x00old-value");

      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old) => `new-${old}`,
      });

      const binding = namespace.bind("user");
      binding.getValue();
      binding.set("new-value");

      expect(mockStorage.getItem("app\x1Fuser")).toBe("\x001.0.0\x00new-value");
    });

    it("version persists across new bindings", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
        version: "1.0.0",
      });

      const binding1 = namespace.bind("key1");
      binding1.set("value1");

      const binding2 = namespace.bind("key2");
      binding2.set("value2");

      expect(mockStorage.getItem("app\x1Fkey1")).toBe("\x001.0.0\x00value1");
      expect(mockStorage.getItem("app\x1Fkey2")).toBe("\x001.0.0\x00value2");
    });
  });
});
