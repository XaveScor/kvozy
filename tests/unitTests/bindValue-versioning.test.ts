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

describe("bindValue versioning", () => {
  describe("storage format", () => {
    it("stores without version when version option is undefined", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("value");

      expect(mockStorage.getItem("test")).toBe("value");
    });

    it("stores with version using \\x00 separator when version is defined", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("value");

      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00value");
    });

    it("handles serialized value containing \\x00 correctly", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("value\x00with\x00null");

      expect(mockStorage.getItem("test")).toBe(
        "\x001.0.0\x00value\x00with\x00null",
      );
    });
  });

  describe("backwards compatibility", () => {
    it("migrates old format (no version) when version is defined", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized) => oldSerialized,
      });

      expect(binding.getValue()).toBe("old value");
    });

    it("treats unversioned value as oldVersion undefined", () => {
      const mockStorage = createMockStorage();
      let capturedOldVersion: string | undefined;
      mockStorage.setItem("test", "old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized, oldVersion) => {
          capturedOldVersion = oldVersion;
          return "migrated";
        },
      });

      binding.getValue();

      expect(capturedOldVersion).toBeUndefined();
    });
  });

  describe("version mismatch - no migrate", () => {
    it("returns default value when migrate is undefined and version mismatches", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe("default");
    });

    it("clears old value when using default fallback", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.getValue();

      expect(mockStorage.getItem("test")).toBeNull();
    });

    it("returns default when old version is undefined and new version is defined", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "old unversioned value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe("default");
    });
  });

  describe("version mismatch - with migrate", () => {
    it("calls migrate with oldSerialized and oldVersion", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      let capturedOldSerialized = "";
      let capturedOldVersion: string | undefined;
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized, oldVersion) => {
          capturedOldSerialized = oldSerialized;
          capturedOldVersion = oldVersion;
          return "migrated value";
        },
      });

      const result = binding.getValue();

      expect(capturedOldSerialized).toBe("old value");
      expect(capturedOldVersion).toBe("0.9.0");
      expect(result).toBe("migrated value");
    });

    it("stores migrated value with new version", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: () => "migrated value",
      });

      binding.getValue();

      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00migrated value");
    });

    it("handles migration errors silently and uses default", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: () => {
          throw new Error("Migration failed");
        },
      });

      const result = binding.getValue();

      expect(result).toBe("default");
      expect(mockStorage.getItem("test")).toBeNull();
    });

    it("clears old value on migration error", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: () => {
          throw new Error("Migration failed");
        },
      });

      binding.getValue();

      expect(mockStorage.getItem("test")).toBeNull();
    });
  });

  describe("version match", () => {
    it("no migration when versions match", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x001.0.0\x00value");
      let migrateCalled = false;
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: () => {
          migrateCalled = true;
          return "migrated";
        },
      });

      const result = binding.getValue();

      expect(migrateCalled).toBe(false);
      expect(result).toBe("value");
    });

    it("deserializes correctly when versions match", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", '\x001.0.0\x00{"name":"John"}');
      const binding = bindValue<{ name: string }>({
        key: "test",
        defaultValue: { name: "" },
        storage: mockStorage,
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
        version: "1.0.0",
      });

      const result = binding.getValue();

      expect(result).toEqual({ name: "John" });
    });

    it("no migration when both versions are undefined", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "value");
      let migrateCalled = false;
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        migrate: () => {
          migrateCalled = true;
          return "migrated";
        },
      });

      binding.getValue();

      expect(migrateCalled).toBe(false);
      expect(binding.getValue()).toBe("value");
    });
  });

  describe("set and update with versioning", () => {
    it("updates storage with new version after migration", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00old value");
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized) => `migrated:${oldSerialized}`,
      });

      binding.getValue();

      expect(mockStorage.getItem("test")).toBe(
        "\x001.0.0\x00migrated:old value",
      );
    });

    it("subsequent updates maintain version format", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("first");
      binding.set("second");
      binding.set("third");

      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00third");
    });

    it("getValue returns correct value after versioned updates", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("first");
      expect(binding.getValue()).toBe("first");

      binding.set("second");
      expect(binding.getValue()).toBe("second");

      binding.set("third");
      expect(binding.getValue()).toBe("third");
    });
  });
});
