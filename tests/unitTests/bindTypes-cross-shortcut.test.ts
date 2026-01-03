import { describe, it, expect } from "vitest";
import {
  bindStringValue,
  bindNumberValue,
  bindBooleanValue,
} from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("cross-shortcut compatibility", () => {
  it("multiple shortcuts can share storage", () => {
    const mockStorage = createMockStorage();

    const stringBinding = bindStringValue({
      key: "str",
      defaultValue: "",
      storage: mockStorage,
    });

    const numberBinding = bindNumberValue({
      key: "num",
      defaultValue: 0,
      storage: mockStorage,
    });

    const boolBinding = bindBooleanValue({
      key: "bool",
      defaultValue: false,
      storage: mockStorage,
    });

    stringBinding.set("test");
    numberBinding.set(42);
    boolBinding.set(true);

    expect(mockStorage.length).toBe(3);
    expect(stringBinding.getValue()).toBe("test");
    expect(numberBinding.getValue()).toBe(42);
    expect(boolBinding.getValue()).toBe(true);
  });
});
