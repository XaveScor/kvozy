import { describe, it, expect, vi } from "vitest";
import { bindValue, BindValue } from "../../src/bindValue.js";

describe("bindValue in-memory storage", () => {
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
