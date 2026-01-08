import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValueNS, useStorageNS } from "../../src/index.js";
import { _clearInMemoryStorage } from "../../src/bindValue.js";

describe("useStorageNS with in-memory storage", () => {
  beforeEach(() => {
    _clearInMemoryStorage();
  });

  it("returns value and setValue", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

    expect(result.current).toHaveProperty("value");
    expect(result.current).toHaveProperty("setValue");
  });

  it("returns defaultValue when key doesn't exist", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "non-existent" }),
    );

    expect(result.current.value).toBe("default");
  });

  it("updates value when setValue is called", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

    act(() => {
      result.current.setValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });

  it("multiple components with different keys don't interfere", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result: result1 } = renderHook(() =>
      useStorageNS(namespace, { key: "key1" }),
    );
    const { result: result2 } = renderHook(() =>
      useStorageNS(namespace, { key: "key2" }),
    );

    act(() => {
      result1.current.setValue("value1");
    });

    act(() => {
      result2.current.setValue("value2");
    });

    expect(result1.current.value).toBe("value1");
    expect(result2.current.value).toBe("value2");
  });

  it("unsubscribe on component unmount", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result, unmount } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

    act(() => {
      result.current.setValue("first value");
    });

    unmount();

    act(() => {
      namespace.bind("test").set("second value");
    });
  });

  it("data persists across instances with same prefix and key", () => {
    const namespace1 = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const { result: result1 } = renderHook(() =>
      useStorageNS(namespace1, { key: "shared" }),
    );

    act(() => {
      result1.current.setValue("shared-value");
    });

    const namespace2 = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const { result: result2 } = renderHook(() =>
      useStorageNS(namespace2, { key: "shared" }),
    );

    expect(result2.current.value).toBe("shared-value");
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

    const { result: appResult } = renderHook(() =>
      useStorageNS(appNS, { key: "data" }),
    );
    const { result: userResult } = renderHook(() =>
      useStorageNS(userNS, { key: "data" }),
    );

    act(() => {
      appResult.current.setValue("app-value");
    });

    act(() => {
      userResult.current.setValue("user-value");
    });

    expect(appResult.current.value).toBe("app-value");
    expect(userResult.current.value).toBe("user-value");
  });

  it("works with explicit storage: undefined", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
      storage: undefined,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "data" }),
    );

    act(() => {
      result.current.setValue("value");
    });

    expect(result.current.value).toBe("value");
  });

  it("works with number type in in-memory storage", () => {
    const namespace = bindValueNS<number>({
      prefix: "app",
      defaultValue: 0,
      serialize: (v) => String(v),
      deserialize: (s) => Number(s),
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "count" }),
    );

    act(() => {
      result.current.setValue(42);
    });

    expect(result.current.value).toBe(42);
  });

  it("works with boolean type in in-memory storage", () => {
    const namespace = bindValueNS<boolean>({
      prefix: "app",
      defaultValue: false,
      serialize: (v) => String(v),
      deserialize: (s) => s === "true",
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "enabled" }),
    );

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);
  });

  it("works with object type in in-memory storage", () => {
    const namespace = bindValueNS<{ value: string }>({
      prefix: "app",
      defaultValue: { value: "default" },
      serialize: (v) => JSON.stringify(v),
      deserialize: (s) => JSON.parse(s),
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "data" }),
    );

    act(() => {
      result.current.setValue({ value: "custom" });
    });

    expect(result.current.value).toEqual({ value: "custom" });
  });

  it("data persists across same prefix and key combinations", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const { result: result1 } = renderHook(() =>
      useStorageNS(namespace, { key: "key1" }),
    );

    act(() => {
      result1.current.setValue("value1");
    });

    const { result: result2 } = renderHook(() =>
      useStorageNS(namespace, { key: "key1" }),
    );

    expect(result1.current.value).toBe("value1");
    expect(result2.current.value).toBe("value1");
  });
});
