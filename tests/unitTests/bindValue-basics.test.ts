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

  describe("reset()", () => {
    it("removes key from storage", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("some value");
      expect(mockStorage.getItem("test")).toBe("some value");

      binding.reset();
      expect(mockStorage.getItem("test")).toBeNull();
    });

    it("sets internal value to defaultValue", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("some value");
      expect(binding.getValue()).toBe("some value");

      binding.reset();
      expect(binding.getValue()).toBe("default");
    });

    it("notifies subscribers", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      let notifiedValue: string | null = null;
      binding.subscribe((value) => {
        notifiedValue = value;
      });

      binding.set("some value");
      expect(notifiedValue).toBe("some value");

      binding.reset();
      expect(notifiedValue).toBe("default");
    });

    it("idempotent when key doesn't exist", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(mockStorage.getItem("test")).toBeNull();
      expect(binding.getValue()).toBe("default");

      binding.reset();
      expect(mockStorage.getItem("test")).toBeNull();
      expect(binding.getValue()).toBe("default");

      binding.reset();
      expect(mockStorage.getItem("test")).toBeNull();
      expect(binding.getValue()).toBe("default");
    });

    it("multiple subscribers receive reset notification", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const subscriber1Values: string[] = [];
      const subscriber2Values: string[] = [];

      binding.subscribe((value) => subscriber1Values.push(value));
      binding.subscribe((value) => subscriber2Values.push(value));

      binding.set("first");
      expect(subscriber1Values).toEqual(["first"]);
      expect(subscriber2Values).toEqual(["first"]);

      binding.reset();
      expect(subscriber1Values).toEqual(["first", "default"]);
      expect(subscriber2Values).toEqual(["first", "default"]);
    });

    it("reset then set works correctly", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("first");
      expect(binding.getValue()).toBe("first");
      expect(mockStorage.getItem("test")).toBe("first");

      binding.reset();
      expect(binding.getValue()).toBe("default");
      expect(mockStorage.getItem("test")).toBeNull();

      binding.set("second");
      expect(binding.getValue()).toBe("second");
      expect(mockStorage.getItem("test")).toBe("second");
    });

    it("reset with versioned data", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("some value");
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00some value");
      expect(binding.getValue()).toBe("some value");

      binding.reset();
      expect(mockStorage.getItem("test")).toBeNull();
      expect(binding.getValue()).toBe("default");

      binding.set("new value");
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00new value");
      expect(binding.getValue()).toBe("new value");
    });
  });
});
