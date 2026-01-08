import { describe, it, expect, beforeEach } from "vitest";
import { bindValueNS, _clearInMemoryStorage } from "../../src/bindValue.js";

describe("bindValueNS in-memory storage", () => {
  beforeEach(() => {
    _clearInMemoryStorage();
  });

  describe("works with in-memory storage", () => {
    it("works without storage parameter", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding = namespace.bind("data");
      expect(binding.getValue()).toBe("default");

      binding.set("value");
      expect(binding.getValue()).toBe("value");
    });

    it("persists data across instances with same prefix and key", () => {
      const namespace1 = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding1 = namespace1.bind("data");
      binding1.set("shared-value");

      const namespace2 = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding2 = namespace2.bind("data");
      expect(binding2.getValue()).toBe("shared-value");
    });
  });

  describe("multiple bindings with in-memory storage", () => {
    it("creates multiple bindings from same namespace", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      binding1.set("value1");
      binding2.set("value2");

      expect(binding1.getValue()).toBe("value1");
      expect(binding2.getValue()).toBe("value2");
    });

    it("different namespaces don't interfere", () => {
      const appNS = bindValueNS<string>({
        prefix: "app",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const userNS = bindValueNS<string>({
        prefix: "user",
        defaultValue: "",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const appBinding = appNS.bind("data");
      const userBinding = userNS.bind("data");

      appBinding.set("app-value");
      userBinding.set("user-value");

      expect(appBinding.getValue()).toBe("app-value");
      expect(userBinding.getValue()).toBe("user-value");
    });
  });

  describe("in-memory storage with versioning", () => {
    it("supports versioning in in-memory storage", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const binding = namespace.bind("data");
      binding.set("versioned-value");
      expect(binding.getValue()).toBe("versioned-value");
    });

    it("migrates data in in-memory storage", () => {
      const oldNamespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "0.9.0",
      });

      const oldBinding = oldNamespace.bind("data");
      oldBinding.set("old-value");

      const newNamespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (old) => `migrated-${old}`,
      });

      const newBinding = newNamespace.bind("data");
      expect(newBinding.getValue()).toBe("migrated-old-value");
    });
  });

  describe("in-memory storage lifecycle", () => {
    it("new bindings start fresh after creation", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding1 = namespace.bind("key1");
      binding1.set("value1");

      const binding2 = namespace.bind("key2");
      expect(binding2.getValue()).toBe("default");
    });

    it("retrieving existing key returns stored value", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding1 = namespace.bind("shared-key");
      binding1.set("shared-value");

      const binding2 = namespace.bind("shared-key");
      expect(binding2.getValue()).toBe("shared-value");
    });

    it("updating one binding updates storage for same key", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const binding1 = namespace.bind("shared-key");
      binding1.set("value1");

      const binding2 = namespace.bind("shared-key");
      expect(binding2.getValue()).toBe("value1");

      binding2.set("value2");
      expect(binding2.getValue()).toBe("value2");
    });
  });

  describe("in-memory storage with different types", () => {
    it("works with number type in in-memory storage", () => {
      const namespace = bindValueNS<number>({
        prefix: "app",
        defaultValue: 0,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
      });

      const binding = namespace.bind("count");
      binding.set(42);
      expect(binding.getValue()).toBe(42);
    });

    it("works with boolean type in in-memory storage", () => {
      const namespace = bindValueNS<boolean>({
        prefix: "app",
        defaultValue: false,
        serialize: (v) => String(v),
        deserialize: (s) => s === "true",
      });

      const binding = namespace.bind("enabled");
      binding.set(true);
      expect(binding.getValue()).toBe(true);
    });

    it("works with object type in in-memory storage", () => {
      const namespace = bindValueNS<{ value: string }>({
        prefix: "app",
        defaultValue: { value: "default" },
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      });

      const binding = namespace.bind("data");
      binding.set({ value: "custom" });
      expect(binding.getValue()).toEqual({ value: "custom" });
    });
  });

  describe("in-memory storage errors", () => {
    it("handles serialize errors gracefully in in-memory storage", () => {
      const namespace = bindValueNS<{ value: string }>({
        prefix: "app",
        defaultValue: { value: "default" },
        serialize: () => {
          throw new Error("Serialize error");
        },
        deserialize: (s) => JSON.parse(s),
      });

      const binding = namespace.bind("data");
      binding.set({ value: "new" });
      expect(binding.getValue()).toEqual({ value: "new" });
    });

    it("handles deserialize errors gracefully in in-memory storage", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: () => {
          throw new Error("Deserialize error");
        },
      });

      const binding = namespace.bind("data");
      binding.set("value");
      expect(binding.getValue()).toBe("value");
    });
  });
});
