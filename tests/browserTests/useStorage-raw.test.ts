import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../../src/index.js";

describe("useStorage with raw methods", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe("getRaw()", () => {
    it("returns raw value from hook", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      binding.set("test value");
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.getRaw()).toBe("test value");
    });

    it("returns null when key doesn't exist", () => {
      const binding = bindValue<string>({
        key: "non-existent-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.getRaw()).toBe(null);
    });

    it("returns versioned raw value with prefix", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      binding.set("test value");
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.getRaw()).toBe("\x001.0.0\x00test value");
    });
  });

  describe("setRaw()", () => {
    it("sets raw value and updates component", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setRaw("new value");
      });

      expect(result.current.value).toBe("new value");
      expect(localStorage.getItem("test-key")).toBe("new value");
    });

    it("notifies other components using same binding", () => {
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
        result1.current.setRaw("synced value");
      });

      expect(result1.current.value).toBe("synced value");
      expect(result2.current.value).toBe("synced value");
    });

    it("does NOT update when round-trip fails", () => {
      const binding = bindValue<number>({
        key: "test-key",
        defaultValue: 0,
        storage: localStorage,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setRaw("invalid");
      });

      expect(result.current.value).toBe(0);
      expect(localStorage.getItem("test-key")).toBe(null);
    });

    it("handles versioned raw values correctly", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setRaw("\x001.0.0\x00new value");
      });

      expect(result.current.value).toBe("new value");
      expect(localStorage.getItem("test-key")).toBe("\x001.0.0\x00new value");
    });

    it("use case: copy between storages", () => {
      const localBinding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const sessionBinding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: sessionStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      const { result: localResult } = renderHook(() =>
        useStorage(localBinding),
      );
      const { result: sessionResult } = renderHook(() =>
        useStorage(sessionBinding),
      );

      act(() => {
        localResult.current.setValue("original value");
      });

      const rawValue = localResult.current.getRaw();

      act(() => {
        if (rawValue !== null) {
          sessionResult.current.setRaw(rawValue);
        }
      });

      expect(localResult.current.value).toBe("original value");
      expect(sessionResult.current.value).toBe("original value");
      expect(localStorage.getItem("test-key")).toBe("original value");
      expect(sessionStorage.getItem("test-key")).toBe("original value");
    });
  });

  describe("re-render behavior", () => {
    it("getRaw does NOT cause re-renders", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStorage(binding);
      });

      const initialRenderCount = renderCount;

      result.current.getRaw();
      result.current.getRaw();
      result.current.getRaw();

      expect(renderCount).toBe(initialRenderCount);
    });

    it("setRaw only re-renders when value changes", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStorage(binding);
      });

      act(() => {
        result.current.setRaw("first value");
      });

      const afterFirstSet = renderCount;

      act(() => {
        result.current.setRaw("second value");
      });

      const afterSecondSet = renderCount;

      expect(afterSecondSet).toBeGreaterThan(afterFirstSet);
      expect(afterFirstSet).toBeGreaterThan(0);
    });

    it("setRaw does NOT re-render when validation fails", () => {
      const binding = bindValue<number>({
        key: "test-key",
        defaultValue: 0,
        storage: localStorage,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
      });

      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStorage(binding);
      });

      const initialRenderCount = renderCount;

      act(() => {
        result.current.setRaw("invalid");
      });

      expect(renderCount).toBe(initialRenderCount);
    });
  });
});
