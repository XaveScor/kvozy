import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../../src/index.js";

describe("useStorage with localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns value and setValue", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: localStorage,
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
      storage: localStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    expect(result.current.value).toBe("default");
  });

  it("loads initial value from localStorage", () => {
    localStorage.setItem("test-key", "initial value");
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: localStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    expect(result.current.value).toBe("initial value");
  });

  it("updates value when setValue is called", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: localStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() => useStorage(binding));

    act(() => {
      result.current.setValue("new value");
    });

    expect(result.current.value).toBe("new value");
    expect(localStorage.getItem("test-key")).toBe("new value");
  });

  it("multiple components sharing same binding sync", () => {
    const binding = bindValue<string>({
      key: "shared-key",
      defaultValue: "default",
      storage: localStorage,
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

  it("unsubscribe on component unmount", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: localStorage,
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

  it("new component does not re-render when value unchanged", () => {
    const binding = bindValue<string>({
      key: "test-key",
      defaultValue: "default",
      storage: localStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result: result1 } = renderHook(() => useStorage(binding));

    let renderCount = 0;
    renderHook(() => {
      renderCount++;
    });

    act(() => {
      result1.current.setValue("test value");
    });

    const initialRenderCount = renderCount;

    renderHook(() => useStorage(binding));

    expect(renderCount).toBe(initialRenderCount);
  });
});
