import { describe, it, expect, vi } from "vitest";
import { bindValue, BindValue } from "../src/bindValue.js";

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

describe("bindValue", () => {
  describe("with mock storage", () => {
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

    it("getValue() returns defaultValue when key doesn't exist", () => {
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

    it("getValue() returns current value", () => {
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

    it("set() updates mockStorage", () => {
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

    it("set() updates internal value", () => {
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

    it("subscribe() returns unsubscribe function", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();
      const unsubscribe = binding.subscribe(callback);

      expect(typeof unsubscribe).toBe("function");

      unsubscribe();
    });

    it("subscribe() notifies subscribers on set()", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);
      binding.set("new value");

      expect(callback).toHaveBeenCalledWith("new value");
    });

    it("unsubscribe() prevents further notifications", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      const unsubscribe = binding.subscribe(callback);
      binding.set("first value");
      unsubscribe();
      binding.set("second value");

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("first value");
    });

    it("multiple subscribers all receive updates", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      binding.subscribe(callback1);
      binding.subscribe(callback2);
      binding.subscribe(callback3);

      binding.set("new value");

      expect(callback1).toHaveBeenCalledWith("new value");
      expect(callback2).toHaveBeenCalledWith("new value");
      expect(callback3).toHaveBeenCalledWith("new value");
    });

    it("set() overwrites existing value", () => {
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

    it("subscribe() does not call callback immediately", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);

      expect(callback).not.toHaveBeenCalled();
    });

    it("subscribe() calls callback only on value change", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);
      expect(callback).not.toHaveBeenCalled();

      binding.set("new value");
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith("new value");
    });
  });

  describe("with number type", () => {
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

  describe("with object type", () => {
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

      const binding = bindValue<{ data: string; nonSerializable?: boolean }>({
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

  describe("with in-memory storage", () => {
    it("works without storage parameter", () => {
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding).toBeInstanceOf(BindValue);
      expect(binding.getValue()).toBe("default");
    });

    it("works with explicit undefined", () => {
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: undefined,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding).toBeInstanceOf(BindValue);
      expect(binding.getValue()).toBe("default");
    });

    it("set() updates value", () => {
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("new value");

      expect(binding.getValue()).toBe("new value");
    });

    it("subscribe() works with in-memory storage", () => {
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const callback = vi.fn();

      binding.subscribe(callback);
      binding.set("new value");

      expect(callback).toHaveBeenCalledWith("new value");
    });

    it("data persists across instances with same key", () => {
      const binding1 = bindValue<string>({
        key: "shared-key",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      binding1.set("shared value");

      const binding2 = bindValue<string>({
        key: "shared-key",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      expect(binding2.getValue()).toBe("shared value");
    });

    it("data does not mix between different keys", () => {
      const binding1 = bindValue<string>({
        key: "key1",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const binding2 = bindValue<string>({
        key: "key2",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding1.set("value1");
      binding2.set("value2");

      expect(binding1.getValue()).toBe("value1");
      expect(binding2.getValue()).toBe("value2");
    });
  });
});
