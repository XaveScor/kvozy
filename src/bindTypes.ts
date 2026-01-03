import { bindValue, BindValue, type BindValueOptions } from "./bindValue.js";

export function bindStringValue(
  options: Omit<
    BindValueOptions<string>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: string;
  },
): BindValue<string> {
  return bindValue<string>({
    key: options.key,
    defaultValue: options.defaultValue ?? "",
    serialize: (v) => v,
    deserialize: (s) => s,
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindNumberValue(
  options: Omit<
    BindValueOptions<number>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: number;
  },
): BindValue<number> {
  return bindValue<number>({
    key: options.key,
    defaultValue: options.defaultValue ?? 0,
    serialize: (v) => String(v),
    deserialize: (s) => Number(s),
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindBooleanValue(
  options: Omit<
    BindValueOptions<boolean>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: boolean;
  },
): BindValue<boolean> {
  return bindValue<boolean>({
    key: options.key,
    defaultValue: options.defaultValue ?? false,
    serialize: (v) => String(v),
    deserialize: (s) => s === "true",
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindJSONValue<T>(
  options: Omit<BindValueOptions<T>, "serialize" | "deserialize">,
): BindValue<T> {
  return bindValue<T>({
    key: options.key,
    defaultValue: options.defaultValue,
    serialize: (v) => JSON.stringify(v),
    deserialize: (s) => JSON.parse(s),
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindEnumValue<E extends string | number>(
  options: Omit<BindValueOptions<E>, "serialize" | "deserialize">,
): BindValue<E> {
  return bindValue<E>({
    key: options.key,
    defaultValue: options.defaultValue,
    serialize: (v) => String(v),
    deserialize: (s) =>
      (typeof options.defaultValue === "number" ? Number(s) : s) as E,
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}
