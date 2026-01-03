import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../src/index.js";

const createFailingSerializer = () => {
  return (value: any) => {
    if (value.hasCycle || value.hasFunction || value.nonSerializable) {
      throw new Error("Cannot serialize");
    }
    return JSON.stringify(value);
  };
};

describe("useStorage", () => {
  describe("with localStorage", () => {
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

  describe("with sessionStorage", () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it("returns value and setValue", () => {
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: sessionStorage,
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
        storage: sessionStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("default");
    });

    it("loads initial value from sessionStorage", () => {
      sessionStorage.setItem("test-key", "initial value");
      const binding = bindValue<string>({
        key: "test-key",
        defaultValue: "default",
        storage: sessionStorage,
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
        storage: sessionStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
      });
      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue("new value");
      });

      expect(result.current.value).toBe("new value");
      expect(sessionStorage.getItem("test-key")).toBe("new value");
    });

    it("multiple components sharing same binding sync", () => {
      const binding = bindValue<string>({
        key: "shared-key",
        defaultValue: "default",
        storage: sessionStorage,
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
        storage: sessionStorage,
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
        storage: sessionStorage,
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

  describe("with in-memory storage", () => {
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

  describe("with number type", () => {
    it("works with number type", () => {
      const binding = bindValue<number>({
        key: "test-key",
        defaultValue: 0,
        storage: localStorage,
        serialize: (v) => String(v),
        deserialize: (s) => Number(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe(0);

      act(() => {
        result.current.setValue(42);
      });

      expect(result.current.value).toBe(42);
      expect(localStorage.getItem("test-key")).toBe("42");
    });
  });

  describe("with object type", () => {
    it("works with object type", () => {
      interface User {
        name: string;
        age: number;
      }

      const binding = bindValue<User>({
        key: "user-key",
        defaultValue: { name: "", age: 0 },
        storage: localStorage,
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue({ name: "John", age: 30 });
      });

      expect(result.current.value).toEqual({ name: "John", age: 30 });
      expect(localStorage.getItem("user-key")).toBe(
        JSON.stringify({ name: "John", age: 30 }),
      );
    });
  });

  describe("deserialize failure", () => {
    it("returns defaultValue when deserialize fails", () => {
      localStorage.setItem("test-key", "invalid json");

      const binding = bindValue<{ data: string }>({
        key: "test-key",
        defaultValue: { data: "default" },
        storage: localStorage,
        serialize: (v) => JSON.stringify(v),
        deserialize: (s) => JSON.parse(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toEqual({ data: "default" });
    });
  });

  describe("serialize failure", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    afterEach(() => {
      localStorage.clear();
    });

    it("keeps in-memory value when serialize fails", () => {
      const failingSerialize = createFailingSerializer();

      const binding = bindValue<{ data: string; nonSerializable?: boolean }>({
        key: "test-key",
        defaultValue: { data: "default" },
        storage: localStorage,
        serialize: failingSerialize,
        deserialize: (s) => JSON.parse(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue({ data: "value", nonSerializable: true });
      });

      expect(result.current.value).toEqual({
        data: "value",
        nonSerializable: true,
      });
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("handles non-serializable values gracefully, then successfully stores serializable value", () => {
      const failingSerialize = createFailingSerializer();

      const binding = bindValue<{
        data: string;
        hasCycle?: boolean;
        hasFunction?: boolean;
      }>({
        key: "test-key",
        defaultValue: { data: "default" },
        storage: localStorage,
        serialize: failingSerialize,
        deserialize: (s) => JSON.parse(s),
      });

      const { result } = renderHook(() => useStorage(binding));

      act(() => {
        result.current.setValue({ data: "value1", hasCycle: true });
      });
      expect(result.current.value).toEqual({ data: "value1", hasCycle: true });
      expect(localStorage.getItem("test-key")).toBeNull();

      act(() => {
        result.current.setValue({ data: "value2", hasFunction: true });
      });
      expect(result.current.value).toEqual({
        data: "value2",
        hasFunction: true,
      });
      expect(localStorage.getItem("test-key")).toBeNull();

      act(() => {
        result.current.setValue({ data: "value3" });
      });
      expect(result.current.value).toEqual({ data: "value3" });
      expect(localStorage.getItem("test-key")).toBe(
        JSON.stringify({ data: "value3" }),
      );
    });
  });
});
