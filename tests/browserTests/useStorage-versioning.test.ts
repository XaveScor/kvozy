import { describe, it, expect, afterEach } from "vitest";
import { renderHook, cleanup, waitFor } from "@testing-library/react";
import { bindValue } from "../../src/bindValue.js";
import { useStorage } from "../../src/useStorage.js";

describe("useStorage versioning", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  describe("React hook works with versioned storage", () => {
    it("useStorage returns correct value from versioned binding", () => {
      const binding = bindValue<string>({
        key: "test-versioned",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("default");
    });

    it("useStorage updates value and stores with version", () => {
      const binding = bindValue<string>({
        key: "test-versioned-update",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));
      result.current.setValue("new value");

      expect(localStorage.getItem("test-versioned-update")).toBe(
        "\x001.0.0\x00new value",
      );
    });

    it("useStorage loads versioned value from localStorage", () => {
      localStorage.setItem(
        "test-versioned-load",
        "\x001.0.0\x00existing value",
      );

      const binding = bindValue<string>({
        key: "test-versioned-load",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("existing value");
    });

    it("useStorage re-renders on versioned value change", async () => {
      localStorage.setItem("test-versioned-render", "\x001.0.0\x00initial");

      const binding = bindValue<string>({
        key: "test-versioned-render",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("initial");

      result.current.setValue("updated");

      await waitFor(() => {
        expect(result.current.value).toBe("updated");
      });
    });
  });

  describe("migration works in React components", () => {
    it("migrates on mount when version mismatches", () => {
      localStorage.setItem("test-react-migrate", "\x000.9.0\x00old data");

      const binding = bindValue<string>({
        key: "test-react-migrate",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized) => `migrated:${oldSerialized}`,
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("migrated:old data");
      expect(localStorage.getItem("test-react-migrate")).toBe(
        "\x001.0.0\x00migrated:old data",
      );
    });

    it("falls back to default when migrate is undefined and version mismatches", () => {
      localStorage.setItem("test-react-default", "\x000.9.0\x00old data");

      const binding = bindValue<string>({
        key: "test-react-default",
        defaultValue: "default value",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("default value");
      expect(localStorage.getItem("test-react-default")).toBeNull();
    });

    it("handles migration errors gracefully", () => {
      localStorage.setItem("test-react-error", "\x000.9.0\x00old data");

      const binding = bindValue<string>({
        key: "test-react-error",
        defaultValue: "default value",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: () => {
          throw new Error("Migration failed");
        },
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("default value");
      expect(localStorage.getItem("test-react-error")).toBeNull();
    });
  });

  describe("backwards compatibility in React", () => {
    it("loads old format (no version) in React component", () => {
      localStorage.setItem("test-react-old", "old unversioned data");

      const binding = bindValue<string>({
        key: "test-react-old",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized) => oldSerialized,
      });

      const { result } = renderHook(() => useStorage(binding));

      expect(result.current.value).toBe("old unversioned data");
    });
  });

  describe("multiple components with versioned binding", () => {
    it("syncs across components with versioned binding", async () => {
      const binding = bindValue<string>({
        key: "test-sync-versioned",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result: result1 } = renderHook(() => useStorage(binding));
      const { result: result2 } = renderHook(() => useStorage(binding));

      expect(result1.current.value).toBe("default");
      expect(result2.current.value).toBe("default");

      result1.current.setValue("updated");

      await waitFor(() => {
        expect(result1.current.value).toBe("updated");
        expect(result2.current.value).toBe("updated");
      });
    });

    it("both components see migrated value", () => {
      localStorage.setItem("test-sync-migrate", "\x000.9.0\x00old data");

      const binding = bindValue<string>({
        key: "test-sync-migrate",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
        migrate: (oldSerialized) => `migrated:${oldSerialized}`,
      });

      const { result: result1 } = renderHook(() => useStorage(binding));
      const { result: result2 } = renderHook(() => useStorage(binding));

      expect(result1.current.value).toBe("migrated:old data");
      expect(result2.current.value).toBe("migrated:old data");
    });
  });

  describe("unmount with versioned binding", () => {
    it("persists versioned data after unmount", () => {
      const binding = bindValue<string>({
        key: "test-unmount-versioned",
        defaultValue: "default",
        storage: localStorage,
        serialize: (v) => v,
        deserialize: (s) => s,
        version: "1.0.0",
      });

      const { result, unmount } = renderHook(() => useStorage(binding));

      result.current.setValue("persistent");
      expect(localStorage.getItem("test-unmount-versioned")).toBe(
        "\x001.0.0\x00persistent",
      );

      unmount();

      expect(localStorage.getItem("test-unmount-versioned")).toBe(
        "\x001.0.0\x00persistent",
      );
    });
  });
});
