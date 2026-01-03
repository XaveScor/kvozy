import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { bindValue, useStorage } from "../../src/index.js";

const createFailingSerializer = () => {
  return (value: any) => {
    if (value.hasCycle || value.hasFunction || value.nonSerializable) {
      throw new Error("Cannot serialize");
    }
    return JSON.stringify(value);
  };
};

describe("useStorage types and errors", () => {
  describe("number type", () => {
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

  describe("object type", () => {
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

      const binding = bindValue<{
        data: string;
        nonSerializable?: boolean;
      }>({
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
