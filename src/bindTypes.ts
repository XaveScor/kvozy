import {
  bindValue,
  bindValueNS,
  BindValue,
  BindValueNS,
  type BindValueOptions,
  type BindValueNSOptions,
} from "./bindValue.js";

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

export function bindStringValueNS(
  options: Omit<
    BindValueNSOptions<string>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: string;
  },
): BindValueNS<string> {
  return bindValueNS<string>({
    prefix: options.prefix,
    defaultValue: options.defaultValue ?? "",
    serialize: (v) => v,
    deserialize: (s) => s,
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindNumberValueNS(
  options: Omit<
    BindValueNSOptions<number>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: number;
  },
): BindValueNS<number> {
  return bindValueNS<number>({
    prefix: options.prefix,
    defaultValue: options.defaultValue ?? 0,
    serialize: (v) => String(v),
    deserialize: (s) => Number(s),
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindBooleanValueNS(
  options: Omit<
    BindValueNSOptions<boolean>,
    "serialize" | "deserialize" | "defaultValue"
  > & {
    defaultValue?: boolean;
  },
): BindValueNS<boolean> {
  return bindValueNS<boolean>({
    prefix: options.prefix,
    defaultValue: options.defaultValue ?? false,
    serialize: (v) => String(v),
    deserialize: (s) => s === "true",
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindJSONValueNS<T>(
  options: Omit<BindValueNSOptions<T>, "serialize" | "deserialize">,
): BindValueNS<T> {
  return bindValueNS<T>({
    prefix: options.prefix,
    defaultValue: options.defaultValue,
    serialize: (v) => JSON.stringify(v),
    deserialize: (s) => JSON.parse(s),
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}

export function bindEnumValueNS<E extends string | number>(
  options: Omit<BindValueNSOptions<E>, "serialize" | "deserialize">,
): BindValueNS<E> {
  return bindValueNS<E>({
    prefix: options.prefix,
    defaultValue: options.defaultValue,
    serialize: (v) => String(v),
    deserialize: (s) =>
      (typeof options.defaultValue === "number" ? Number(s) : s) as E,
    storage: options.storage,
    version: options.version,
    migrate: options.migrate,
  });
}
