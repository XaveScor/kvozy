import { describe, it, expect } from "vitest";
import { bindValueNS, BindValueNS, BindValue } from "../../src/bindValue.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValueNS basics", () => {
  describe("instance creation", () => {
    it("creates BindValueNS instance", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: createMockStorage(),
      });

      expect(namespace).toBeInstanceOf(BindValueNS);
    });

    it("throws when prefix is empty", () => {
      expect(() => {
        bindValueNS<string>({
          prefix: "",
          defaultValue: "",
          serialize: (v) => v,
          deserialize: (s) => s,
          storage: createMockStorage(),
        });
      }).toThrow("Prefix cannot be empty");
    });

    it("throws when prefix is whitespace only", () => {
      expect(() => {
        bindValueNS<string>({
          prefix: "   ",
          defaultValue: "",
          serialize: (v) => v,
          deserialize: (s) => s,
          storage: createMockStorage(),
        });
      }).toThrow("Prefix cannot be empty");
    });
  });

  describe("bind() method", () => {
    it("creates BindValue instance with combined key", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("user");
      expect(binding).toBeInstanceOf(BindValue);
    });

    it("throws when key is empty", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: createMockStorage(),
      });

      expect(() => namespace.bind("")).toThrow("Key cannot be empty");
    });

    it("throws when key is whitespace only", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: createMockStorage(),
      });

      expect(() => namespace.bind("   ")).toThrow("Key cannot be empty");
    });

    it("combines prefix and key with unit separator", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("user");
      binding.set("test value");

      expect(mockStorage.getItem("app\x1Fuser")).toBe("test value");
      expect(mockStorage.getItem("app:user")).toBeNull();
    });
  });

  describe("multiple bindings", () => {
    it("creates multiple bindings from same namespace", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const userBinding = namespace.bind("user");
      const settingsBinding = namespace.bind("settings");

      userBinding.set("john");
      settingsBinding.set("dark");

      expect(userBinding.getValue()).toBe("john");
      expect(settingsBinding.getValue()).toBe("dark");
    });

    it("stores bindings in separate storage keys", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const userBinding = namespace.bind("user");
      const settingsBinding = namespace.bind("settings");

      userBinding.set("john");
      settingsBinding.set("dark");

      expect(mockStorage.getItem("app\x1Fuser")).toBe("john");
      expect(mockStorage.getItem("app\x1Fsettings")).toBe("dark");
    });

    it("shares configuration across bindings", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<number>({
        prefix: "app",
        defaultValue: 0,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
        storage: mockStorage,
      });

      const binding1 = namespace.bind("count1");
      const binding2 = namespace.bind("count2");

      binding1.set(5);
      binding2.set(10);

      expect(binding1.getValue()).toBe(5);
      expect(binding2.getValue()).toBe(10);
    });
  });

  describe("default value handling", () => {
    it("uses shared default value for all bindings", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default-value",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      expect(binding1.getValue()).toBe("default-value");
      expect(binding2.getValue()).toBe("default-value");
    });

    it("default value applies to new bindings", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<number>({
        prefix: "app",
        defaultValue: 42,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
        storage: mockStorage,
      });

      const newBinding = namespace.bind("newKey");
      expect(newBinding.getValue()).toBe(42);
    });
  });

  describe("prefix variations", () => {
    it("handles multi-word prefixes", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "my-application",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("user");
      binding.set("test");

      expect(mockStorage.getItem("my-application\x1Fuser")).toBe("test");
    });

    it("handles prefixes with special characters", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app_v2",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");
      binding.set("test");

      expect(mockStorage.getItem("app_v2\x1Fdata")).toBe("test");
    });

    it("handles prefixes with numbers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app123",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");
      binding.set("test");

      expect(mockStorage.getItem("app123\x1Fdata")).toBe("test");
    });
  });

  describe("key variations", () => {
    it("handles multi-word keys", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("user-preferences");
      binding.set("test");

      expect(mockStorage.getItem("app\x1Fuser-preferences")).toBe("test");
    });

    it("handles keys with numbers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data123");
      binding.set("test");

      expect(mockStorage.getItem("app\x1Fdata123")).toBe("test");
    });

    it("handles keys with special characters", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("user_data");
      binding.set("test");

      expect(mockStorage.getItem("app\x1Fuser_data")).toBe("test");
    });
  });

  describe("separation of namespaces", () => {
    it("different namespaces don't interfere", () => {
      const mockStorage = createMockStorage();
      const appNS = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const userNS = bindValueNS<string>({
        prefix: "user",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const appBinding = appNS.bind("data");
      const userBinding = userNS.bind("data");

      appBinding.set("app-value");
      userBinding.set("user-value");

      expect(appBinding.getValue()).toBe("app-value");
      expect(userBinding.getValue()).toBe("user-value");
      expect(mockStorage.getItem("app\x1Fdata")).toBe("app-value");
      expect(mockStorage.getItem("user\x1Fdata")).toBe("user-value");
    });
  });
});
