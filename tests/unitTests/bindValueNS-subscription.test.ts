import { describe, it, expect } from "vitest";
import { bindValueNS } from "../../src/bindValue.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValueNS subscription", () => {
  describe("basic subscription", () => {
    it("each binding has independent subscribers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      const updates1: string[] = [];
      const updates2: string[] = [];

      const unsubscribe1 = binding1.subscribe((value) => {
        updates1.push(value);
      });

      const unsubscribe2 = binding2.subscribe((value) => {
        updates2.push(value);
      });

      binding1.set("value1");
      binding2.set("value2");

      expect(updates1).toEqual(["value1"]);
      expect(updates2).toEqual(["value2"]);

      unsubscribe1();
      unsubscribe2();
    });

    it("subscribers receive updates for their key only", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const userBinding = namespace.bind("user");
      const settingsBinding = namespace.bind("settings");

      const userUpdates: string[] = [];
      const settingsUpdates: string[] = [];

      userBinding.subscribe((value) => {
        userUpdates.push(value);
      });

      settingsBinding.subscribe((value) => {
        settingsUpdates.push(value);
      });

      userBinding.set("john");
      settingsBinding.set("dark");
      userBinding.set("jane");

      expect(userUpdates).toEqual(["john", "jane"]);
      expect(settingsUpdates).toEqual(["dark"]);
    });
  });

  describe("multiple subscribers per binding", () => {
    it("multiple subscribers receive updates for same binding", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates1: string[] = [];
      const updates2: string[] = [];
      const updates3: string[] = [];

      const unsubscribe1 = binding.subscribe((value) => {
        updates1.push(value);
      });

      const unsubscribe2 = binding.subscribe((value) => {
        updates2.push(value);
      });

      const unsubscribe3 = binding.subscribe((value) => {
        updates3.push(value);
      });

      binding.set("value1");
      binding.set("value2");

      expect(updates1).toEqual(["value1", "value2"]);
      expect(updates2).toEqual(["value1", "value2"]);
      expect(updates3).toEqual(["value1", "value2"]);

      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });
  });

  describe("unsubscribe functionality", () => {
    it("unsubscribe stops receiving updates", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates: string[] = [];

      const unsubscribe = binding.subscribe((value) => {
        updates.push(value);
      });

      binding.set("value1");
      unsubscribe();
      binding.set("value2");

      expect(updates).toEqual(["value1"]);
    });

    it("multiple unsubscribes work correctly", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates1: string[] = [];
      const updates2: string[] = [];

      const unsubscribe1 = binding.subscribe((value) => {
        updates1.push(value);
      });

      const unsubscribe2 = binding.subscribe((value) => {
        updates2.push(value);
      });

      binding.set("value1");
      unsubscribe1();
      binding.set("value2");
      unsubscribe2();
      binding.set("value3");

      expect(updates1).toEqual(["value1"]);
      expect(updates2).toEqual(["value1", "value2"]);
    });

    it("unsubscribing one binding doesn't affect others", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      const updates1: string[] = [];
      const updates2: string[] = [];

      const unsubscribe1 = binding1.subscribe((value) => {
        updates1.push(value);
      });

      binding2.subscribe((value) => {
        updates2.push(value);
      });

      binding1.set("value1");
      binding2.set("value2");
      unsubscribe1();
      binding1.set("value3");
      binding2.set("value4");

      expect(updates1).toEqual(["value1"]);
      expect(updates2).toEqual(["value2", "value4"]);
    });
  });

  describe("subscription behavior", () => {
    it("subscribe does not call callback immediately", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      let callCount = 0;
      binding.subscribe(() => {
        callCount++;
      });

      expect(callCount).toBe(0);
    });

    it("callback invoked on each set call", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates: string[] = [];
      binding.subscribe((value) => {
        updates.push(value);
      });

      binding.set("value1");
      binding.set("value1");
      binding.set("value2");

      expect(updates).toEqual(["value1", "value1", "value2"]);
    });

    it("new subscribers don't receive past updates", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates1: string[] = [];
      const updates2: string[] = [];

      const unsubscribe1 = binding.subscribe((value) => {
        updates1.push(value);
      });

      binding.set("value1");
      binding.set("value2");

      const unsubscribe2 = binding.subscribe((value) => {
        updates2.push(value);
      });

      binding.set("value3");

      expect(updates1).toEqual(["value1", "value2", "value3"]);
      expect(updates2).toEqual(["value3"]);

      unsubscribe1();
      unsubscribe2();
    });
  });

  describe("cross-binding subscription isolation", () => {
    it("updates to one binding don't trigger other bindings' subscribers", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding1 = namespace.bind("key1");
      const binding2 = namespace.bind("key2");

      const updates1: string[] = [];
      const updates2: string[] = [];

      binding1.subscribe((value) => {
        updates1.push(value);
      });

      binding2.subscribe((value) => {
        updates2.push(value);
      });

      binding1.set("value1");
      binding1.set("value2");
      binding1.set("value3");

      expect(updates1).toEqual(["value1", "value2", "value3"]);
      expect(updates2).toEqual([]);
    });

    it("different namespaces maintain independent subscriptions", () => {
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

      const appUpdates: string[] = [];
      const userUpdates: string[] = [];

      appBinding.subscribe((value) => {
        appUpdates.push(value);
      });

      userBinding.subscribe((value) => {
        userUpdates.push(value);
      });

      appBinding.set("app-value");
      userBinding.set("user-value");

      expect(appUpdates).toEqual(["app-value"]);
      expect(userUpdates).toEqual(["user-value"]);
    });
  });

  describe("subscription during value changes", () => {
    it("can subscribe while value is changing", () => {
      const mockStorage = createMockStorage();
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: mockStorage,
      });

      const binding = namespace.bind("data");

      const updates1: string[] = [];
      const updates2: string[] = [];

      const unsubscribe1 = binding.subscribe((value) => {
        updates1.push(value);
      });

      binding.set("value1");

      const unsubscribe2 = binding.subscribe((value) => {
        updates2.push(value);
      });

      binding.set("value2");

      expect(updates1).toEqual(["value1", "value2"]);
      expect(updates2).toEqual(["value2"]);

      unsubscribe1();
      unsubscribe2();
    });
  });
});
