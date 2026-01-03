import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../src/index.js";

describe("useStorage", () => {
  describe("with localStorage", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("returns value and setValue", () => {
      const binding = bindValue({ key: "test-key", storage: localStorage });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current).toHaveProperty("value");
      expect(result.current).toHaveProperty("setValue");
    });

    it("returns undefined when key doesn't exist", () => {
      const binding = bindValue({
        key: "non-existent-key",
        storage: localStorage,
      });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBeUndefined();
    });

    it("loads initial value from localStorage", () => {
      localStorage.setItem("test-key", "initial value");
      const binding = bindValue({ key: "test-key", storage: localStorage });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("initial value");
    });

    it("updates value when setValue is called", () => {
      const binding = bindValue({ key: "test-key", storage: localStorage });
      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue("new value");
      });

      expect(result.current.value).toBe("new value");
      expect(localStorage.getItem("test-key")).toBe("new value");
    });

    it("multiple components sharing same binding sync", () => {
      const binding = bindValue({ key: "shared-key", storage: localStorage });
      const { result: result1 } = renderHook(() => useStorage(binding));
      const { result: result2 } = renderHook(() => useStorage(binding));

      act(() => {
        result1.current.setValue("synced value");
      });

      expect(result1.current.value).toBe("synced value");
      expect(result2.current.value).toBe("synced value");
    });

    it("unsubscribe on component unmount", () => {
      const binding = bindValue({ key: "test-key", storage: localStorage });
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
      const binding = bindValue({ key: "test-key", storage: localStorage });
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

  describe("with sessionStorage", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it("returns value and setValue", () => {
      const binding = bindValue({ key: "test-key", storage: sessionStorage });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current).toHaveProperty("value");
      expect(result.current).toHaveProperty("setValue");
    });

    it("returns undefined when key doesn't exist", () => {
      const binding = bindValue({
        key: "non-existent-key",
        storage: sessionStorage,
      });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBeUndefined();
    });

    it("loads initial value from sessionStorage", () => {
      sessionStorage.setItem("test-key", "initial value");
      const binding = bindValue({ key: "test-key", storage: sessionStorage });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("initial value");
    });

    it("updates value when setValue is called", () => {
      const binding = bindValue({ key: "test-key", storage: sessionStorage });
      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue("new value");
      });

      expect(result.current.value).toBe("new value");
      expect(sessionStorage.getItem("test-key")).toBe("new value");
    });

    it("multiple components sharing same binding sync", () => {
      const binding = bindValue({ key: "shared-key", storage: sessionStorage });
      const { result: result1 } = renderHook(() => useStorage(binding));
      const { result: result2 } = renderHook(() => useStorage(binding));

      act(() => {
        result1.current.setValue("synced value");
      });

      expect(result1.current.value).toBe("synced value");
      expect(result2.current.value).toBe("synced value");
    });

    it("unsubscribe on component unmount", () => {
      const binding = bindValue({ key: "test-key", storage: sessionStorage });
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
      const binding = bindValue({ key: "test-key", storage: sessionStorage });
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

  describe("with in-memory storage", () => {
    it("works without storage parameter", () => {
      const binding = bindValue({ key: "test-key" });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current).toHaveProperty("value");
      expect(result.current).toHaveProperty("setValue");
    });

    it("works with explicit undefined", () => {
      const binding = bindValue({ key: "test-key", storage: undefined });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current).toHaveProperty("value");
      expect(result.current).toHaveProperty("setValue");
    });

    it("returns undefined when key doesn't exist", () => {
      const binding = bindValue({ key: "non-existent-key" });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBeUndefined();
    });

    it("updates value when setValue is called", () => {
      const binding = bindValue({ key: "test-key" });
      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue("new value");
      });

      expect(result.current.value).toBe("new value");
    });

    it("multiple components sharing same binding sync", () => {
      const binding = bindValue({ key: "shared-key" });
      const { result: result1 } = renderHook(() => useStorage(binding));
      const { result: result2 } = renderHook(() => useStorage(binding));

      act(() => {
        result1.current.setValue("synced value");
      });

      expect(result1.current.value).toBe("synced value");
      expect(result2.current.value).toBe("synced value");
    });

    it("data persists across instances with same key", () => {
      const binding1 = bindValue({ key: "persistent-key" });
      const { result: result1 } = renderHook(() => useStorage(binding1));

      act(() => {
        result1.current.setValue("persistent value");
      });

      const binding2 = bindValue({ key: "persistent-key" });
      const { result: result2 } = renderHook(() => useStorage(binding2));

      expect(result2.current.value).toBe("persistent value");
    });

    it("unsubscribe on component unmount", () => {
      const binding = bindValue({ key: "test-key" });
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
      const binding1 = bindValue({ key: "key1" });
      const binding2 = bindValue({ key: "key2" });
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
});
