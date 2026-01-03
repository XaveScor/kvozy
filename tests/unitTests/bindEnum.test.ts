import { describe, it, expect } from "vitest";
import { bindEnumValue } from "../../src/bindTypes.js";
import { createMockStorage } from "./test-utils.js";

describe("bindEnumValue", () => {
  describe("string enums", () => {
    enum Color {
      Red = "red",
      Green = "green",
      Blue = "blue",
    }

    it("works with string enum", () => {
      const mockStorage = createMockStorage();
      const binding = bindEnumValue<Color>({
        key: "color",
        defaultValue: Color.Red,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(Color.Red);
      binding.set(Color.Blue);
      expect(binding.getValue()).toBe(Color.Blue);
    });

    it("persists string enum as string", () => {
      const mockStorage = createMockStorage();
      const binding = bindEnumValue<Color>({
        key: "color",
        defaultValue: Color.Red,
        storage: mockStorage,
      });

      binding.set(Color.Green);
      expect(mockStorage.getItem("color")).toBe("green");
    });

    it("retrieves string enum from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("color", "blue");
      const binding = bindEnumValue<Color>({
        key: "color",
        defaultValue: Color.Red,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(Color.Blue);
    });
  });

  describe("number enums", () => {
    enum Priority {
      Low = 1,
      Medium = 2,
      High = 3,
    }

    it("works with number enum", () => {
      const mockStorage = createMockStorage();
      const binding = bindEnumValue<Priority>({
        key: "priority",
        defaultValue: Priority.Low,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(Priority.Low);
      binding.set(Priority.High);
      expect(binding.getValue()).toBe(Priority.High);
    });

    it("persists number enum as string", () => {
      const mockStorage = createMockStorage();
      const binding = bindEnumValue<Priority>({
        key: "priority",
        defaultValue: Priority.Low,
        storage: mockStorage,
      });

      binding.set(Priority.Medium);
      expect(mockStorage.getItem("priority")).toBe("2");
    });

    it("retrieves number enum from storage", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("priority", "3");
      const binding = bindEnumValue<Priority>({
        key: "priority",
        defaultValue: Priority.Low,
        storage: mockStorage,
      });

      expect(binding.getValue()).toBe(Priority.High);
    });
  });

  describe("mixed enum values", () => {
    enum MixedEnum {
      First = 1,
      Second = "second",
      Third = 3,
    }

    it("handles enums with mixed value types", () => {
      const mockStorage = createMockStorage();
      const binding = bindEnumValue<MixedEnum>({
        key: "mixed",
        defaultValue: MixedEnum.First,
        storage: mockStorage,
      });

      binding.set(MixedEnum.Second);
      expect(binding.getValue()).toBe(MixedEnum.Second);
      expect(mockStorage.getItem("mixed")).toBe("second");

      binding.set(MixedEnum.Third);
      expect(binding.getValue()).toBe(MixedEnum.Third);
      expect(mockStorage.getItem("mixed")).toBe("3");
    });
  });

  describe("versioning", () => {
    enum Status {
      Active = "active",
      Inactive = "inactive",
    }

    it("supports versioned storage for string enum", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x001.0.0\x00active");
      const binding = bindEnumValue<Status>({
        key: "test",
        defaultValue: Status.Inactive,
        storage: mockStorage,
        version: "1.0.0",
      });

      expect(binding.getValue()).toBe(Status.Active);
    });

    it("migrates between enum versions", () => {
      const mockStorage = createMockStorage();
      mockStorage.setItem("test", "\x000.9.0\x00active");
      const binding = bindEnumValue<Status>({
        key: "test",
        defaultValue: Status.Inactive,
        storage: mockStorage,
        version: "1.0.0",
        migrate: (old, oldVersion) => {
          expect(old).toBe("active");
          expect(oldVersion).toBe("0.9.0");
          return Status.Inactive;
        },
      });

      expect(binding.getValue()).toBe(Status.Inactive);
      expect(mockStorage.getItem("test")).toBe("\x001.0.0\x00inactive");
    });
  });
});
