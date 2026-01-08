import { describe, it, expect } from "vitest";
import { bindValueNS } from "../../src/bindValue.js";
import { createMockStorage } from "./test-utils.js";

describe("bindValueNS error handling", () => {
  describe("invalid prefix", () => {
    it("throws on empty prefix", () => {
      expect(() => {
        bindValueNS<string>({
          prefix: "",
          defaultValue: "default",
          serialize: (v) => v,
          deserialize: (s) => s,
          storage: createMockStorage(),
        });
      }).toThrow("Prefix cannot be empty");
    });

    it("throws on whitespace-only prefix", () => {
      expect(() => {
        bindValueNS<string>({
          prefix: "   ",
          defaultValue: "default",
          serialize: (v) => v,
          deserialize: (s) => s,
          storage: createMockStorage(),
        });
      }).toThrow("Prefix cannot be empty");
    });
  });

  describe("invalid key", () => {
    it("throws on empty key when calling bind", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: createMockStorage(),
      });

      expect(() => namespace.bind("")).toThrow("Key cannot be empty");
    });

    it("throws on whitespace-only key when calling bind", () => {
      const namespace = bindValueNS<string>({
        prefix: "app",
        defaultValue: "default",
        serialize: (v) => v,
        deserialize: (s) => s,
        storage: createMockStorage(),
      });

      expect(() => namespace.bind("   ")).toThrow("Key cannot be empty");
    });
  });
});
