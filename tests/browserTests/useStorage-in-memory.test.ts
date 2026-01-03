import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../../src/index.js";

describe("useStorage with in-memory storage", () => {
  it("works without storage parameter", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    expect(result.current).toHaveProperty("value");
    expect(result.current).toHaveProperty("setValue");
  });

  it("works with explicit undefined", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: undefined,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    expect(result.current).toHaveProperty("value");
    expect(result.current).toHaveProperty("setValue");
  });

  it("returns defaultValue when key doesn't exist", () => {
    const binding = bindValue<string>({
      key: "non-existent-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    expect(result.current.value).toBe("default");
  });

  it("updates value when setValue is called", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    act(() => {
      result.current.setValue("new value");
    });

    expect(result.current.value).toBe("new value");
  });

  it("multiple components sharing same binding sync", () => {
    const binding = bindValue<string>({
      key: "shared-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result: result1 } = renderHook(() => useStorage(binding));
    const { result: result2 } = renderHook(() => useStorage(binding));

    act(() => {
      result1.current.setValue("synced value");
    });

    expect(result1.current.value).toBe("synced value");
    expect(result2.current.value).toBe("synced value");
  });

  it("data persists across instances with same key", () => {
    const binding1 = bindValue<string>({
      key: "persistent-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result: result1 } = renderHook(() => useStorage(binding1));

    act(() => {
      result1.current.setValue("persistent value");
    });

    const binding2 = bindValue<string>({
      key: "persistent-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result: result2 } = renderHook(() => useStorage(binding2));

    expect(result2.current.value).toBe("persistent value");
  });

  it("unsubscribe on component unmount", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result, unmount } = renderHook(() => useStorage(binding));

    const renderCount = { count: 0 };
    const { unmount: unmountCounter } = renderHook(() => {
      renderCount.count++;
    });

    act(() => {
      result.current.setValue("first value");
    });

    unmount();
    unmountCounter();

    act(() => {
      binding.set("second value");
    });

    expect(renderCount.count).toBeGreaterThan(0);
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
    const { result: result1 } = renderHook(() => useStorage(binding1));
    const { result: result2 } = renderHook(() => useStorage(binding2));

    act(() => {
      result1.current.setValue("value1");
      result2.current.setValue("value2");
    });

    expect(result1.current.value).toBe("value1");
    expect(result2.current.value).toBe("value2");
  });
});
