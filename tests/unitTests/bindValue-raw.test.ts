import { describe, it, expect, vi } from "vitest";
import { bindValue, BindValue } from "../../src/bindValue.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValue raw methods", () => {
  describe("getRaw()", () => {
    it("returns null when key doesn't exist", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      expect(binding.getRaw()).toBe(null);
    });

    it("returns raw value from storage (unversioned)", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("test value");

      expect(binding.getRaw()).toBe("test value");
    });

    it("returns raw value with version prefix (versioned)", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("test value");

      expect(binding.getRaw()).toBe("\x001.0.0\x00test value");
    });

    it("returns null when value doesn't exist for versioned binding", () => {
      const mockStorage = createMockStorage();
      const binding = bindValue<string>({
        key: "test",
        defaultValue: "default",
        storage: mockStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      expect(binding.getRaw()).toBe(null);
    });
  });

  describe("setRaw()", () => {
    describe("unversioned bindings", () => {
      it("writes to storage when round-trip succeeds", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
        });

        binding.setRaw("new value");

        expect(mockStorage.getItem("test")).toBe("new value");
        expect(binding.getValue()).toBe("new value");
      });

      it("does NOT write when round-trip fails", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<number>({
          key: "test",
          defaultValue: 0,
          storage: mockStorage,
          serialize: (v) => String(v),
          deserialize: (s) => Number(s),
        });

        binding.setRaw("invalid number");

        expect(mockStorage.getItem("test")).toBe(null);
        expect(binding.getValue()).toBe(0);
      });

      it("does NOT notify subscribers when write fails", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<number>({
          key: "test",
          defaultValue: 0,
          storage: mockStorage,
          serialize: (v) => String(v),
          deserialize: (s) => Number(s),
        });

        const subscriber = vi.fn();
        binding.subscribe(subscriber);

        binding.setRaw("invalid number");

        expect(subscriber).not.toHaveBeenCalled();
      });

      it("notifies subscribers when write succeeds", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
        });

        const subscriber = vi.fn();
        binding.subscribe(subscriber);

        binding.setRaw("new value");

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith("new value");
      });

      it("handles JSON serialization correctly", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<{ name: string; age: number }>({
          key: "test",
          defaultValue: { name: "", age: 0 },
          storage: mockStorage,
          serialize: (v) => JSON.stringify(v),
          deserialize: (s) => JSON.parse(s),
        });

        binding.setRaw('{"name":"John","age":30}');

        expect(mockStorage.getItem("test")).toBe('{"name":"John","age":30}');
        expect(binding.getValue()).toEqual({ name: "John", age: 30 });
      });
    });

    describe("versioned bindings", () => {
      it("writes to storage when round-trip succeeds", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        binding.setRaw("\x001.0.0\x00new value");

        expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00new value");
        expect(binding.getValue()).toBe("new value");
      });

      it("does NOT write when version prefix is missing", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        binding.setRaw("value without version");

        expect(mockStorage.getItem("test")).toBe(null);
        expect(binding.getValue()).toBe("default");
      });

      it("does NOT write when version doesn't match", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "2.0.0",
        });

        binding.setRaw("\x001.0.0\x00value");

        expect(mockStorage.getItem("test")).toBe(null);
        expect(binding.getValue()).toBe("default");
      });

      it("does NOT write when deserialization fails", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<{ name: string }>({
          key: "test",
          defaultValue: { name: "" },
          storage: mockStorage,
          serialize: (v) => JSON.stringify(v),
          deserialize: (s) => JSON.parse(s),
          version: "1.0.0",
        });

        binding.setRaw("\x001.0.0\x00invalid json");

        expect(mockStorage.getItem("test")).toBe(null);
        expect(binding.getValue()).toEqual({ name: "" });
      });

      it("notifies subscribers when write succeeds", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        const subscriber = vi.fn();
        binding.subscribe(subscriber);

        binding.setRaw("\x001.0.0\x00new value");

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith("new value");
      });

      it("handles JSON serialization with versioning", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<{ name: string; age: number }>({
          key: "test",
          defaultValue: { name: "", age: 0 },
          storage: mockStorage,
          serialize: (v) => JSON.stringify(v),
          deserialize: (s) => JSON.parse(s),
          version: "1.0.0",
        });

        binding.setRaw('\x001.0.0\x00{"name":"John","age":30}');

        expect(mockStorage.getItem("test")).toBe(
          '\x001.0.0\x00{"name":"John","age":30}',
        );
        expect(binding.getValue()).toEqual({ name: "John", age: 30 });
      });

      it("handles raw value containing null bytes", () => {
        const mockStorage = createMockStorage();
        const binding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: mockStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        binding.setRaw("\x001.0.0\x00value\x00with\x00nulls");

        expect(mockStorage.getItem("test")).toBe(
          "\x001.0.0\x00value\x00with\x00nulls",
        );
        expect(binding.getValue()).toBe("value\x00with\x00nulls");
      });
    });

    describe("use case: copying between storages", () => {
      it("copies value from localStorage to sessionStorage", () => {
        const localStorage = createMockStorage();
        const sessionStorage = createMockStorage();

        const localBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: localStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
        });

        const sessionBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: sessionStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
        });

        localBinding.set("original value");
        const rawValue = localBinding.getRaw();
        if (rawValue !== null) {
          sessionBinding.setRaw(rawValue);
        }

        expect(localBinding.getValue()).toBe("original value");
        expect(sessionBinding.getValue()).toBe("original value");
        expect(localStorage.getItem("test")).toBe("original value");
        expect(sessionStorage.getItem("test")).toBe("original value");
      });

      it("copies versioned value between storages", () => {
        const localStorage = createMockStorage();
        const sessionStorage = createMockStorage();

        const localBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: localStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        const sessionBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: sessionStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        localBinding.set("original value");
        const rawValue = localBinding.getRaw();
        if (rawValue !== null) {
          sessionBinding.setRaw(rawValue);
        }

        expect(localBinding.getValue()).toBe("original value");
        expect(sessionBinding.getValue()).toBe("original value");
        expect(localStorage.getItem("test")).toBe(
          "\x001.0.0\x00original value",
        );
        expect(sessionStorage.getItem("test")).toBe(
          "\x001.0.0\x00original value",
        );
      });

      it("does NOT copy when versions don't match", () => {
        const localStorage = createMockStorage();
        const sessionStorage = createMockStorage();

        const localBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: localStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "1.0.0",
        });

        const sessionBinding = bindValue<string>({
          key: "test",
          defaultValue: "default",
          storage: sessionStorage,
          serialize: (v) => v,
          deserialize: (s) => s,
          version: "2.0.0",
        });

        localBinding.set("original value");
        const rawValue = localBinding.getRaw();
        if (rawValue !== null) {
          sessionBinding.setRaw(rawValue);
        }

        expect(localBinding.getValue()).toBe("original value");
        expect(sessionBinding.getValue()).toBe("default");
        expect(localStorage.getItem("test")).toBe(
          "\x001.0.0\x00original value",
        );
        expect(sessionStorage.getItem("test")).toBe(null);
      });
    });
  });
});
