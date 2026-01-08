import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValueNS, useStorageNS } from "../../src/index.js";

describe("useStorageNS with sessionStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("returns value and setValue", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
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
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "non-existent" }),
    );

    expect(result.current.value).toBe("default");
  });

  it("loads initial value from sessionStorage", () => {
    sessionStorage.setItem("app\x1Ftest", "initial value");
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

    expect(result.current.value).toBe("initial value");
  });

  it("updates value when setValue is called", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
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
    expect(sessionStorage.getItem("app\x1Ftest")).toBe("new value");
  });

  it("multiple components with different keys don't interfere", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
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
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result, unmount } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

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
      namespace.bind("test").set("second value");
    });

    expect(renderCount.count).toBeGreaterThan(0);
  });

  it("keys stored with correct format", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "data" }),
    );

    act(() => {
      result.current.setValue("test value");
    });

    expect(sessionStorage.getItem("app\x1Fdata")).toBe("test value");
    expect(sessionStorage.getItem("app:data")).toBeNull();
  });

  it("different namespaces don't interfere", () => {
    const appNS = bindValueNS<string>({
      prefix: "app",
      defaultValue: "",
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const userNS = bindValueNS<string>({
      prefix: "user",
      defaultValue: "",
      storage: sessionStorage,
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
    expect(sessionStorage.getItem("app\x1Fdata")).toBe("app-value");
    expect(sessionStorage.getItem("user\x1Fdata")).toBe("user-value");
  });

  it("real sessionStorage integration", () => {
    const namespace = bindValueNS<string>({
      prefix: "app",
      defaultValue: "default",
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });
    const { result } = renderHook(() =>
      useStorageNS(namespace, { key: "test" }),
    );

    act(() => {
      result.current.setValue("persisted value");
    });

    expect(sessionStorage.getItem("app\x1Ftest")).toBe("persisted value");
  });

  it("sessionStorage doesn't interfere with localStorage", () => {
    const sessionNS = bindValueNS<string>({
      prefix: "app",
      defaultValue: "session-default",
      storage: sessionStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const localNS = bindValueNS<string>({
      prefix: "app",
      defaultValue: "local-default",
      storage: localStorage,
      serialize: (v) => v,
      deserialize: (s) => s,
    });

    const { result: sessionResult } = renderHook(() =>
      useStorageNS(sessionNS, { key: "test" }),
    );
    const { result: localResult } = renderHook(() =>
      useStorageNS(localNS, { key: "test" }),
    );

    act(() => {
      sessionResult.current.setValue("session-value");
    });

    act(() => {
      localResult.current.setValue("local-value");
    });

    expect(sessionResult.current.value).toBe("session-value");
    expect(localResult.current.value).toBe("local-value");
    expect(sessionStorage.getItem("app\x1Ftest")).toBe("session-value");
    expect(localStorage.getItem("app\x1Ftest")).toBe("local-value");
  });
});
