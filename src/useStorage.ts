import { useState, useEffect } from "react";
import { type BindValue, type BindValueNS } from "./bindValue.js";

export interface UseStorageReturn<T> {
  value: T;
  setValue: (value: T) => void;
}

export function useStorage<T>(binding: BindValue<T>): UseStorageReturn<T> {
  const [value, setValue] = useState(binding.getValue());

  useEffect(() => {
    const unsubscribe = binding.subscribe(setValue);
    return unsubscribe;
  }, [binding]);

  const set = (newValue: T) => {
    binding.set(newValue);
  };

  return { value, setValue: set };
}

export function useStorageNS<T>(
  namespace: BindValueNS<T>,
  options: { key: string },
): UseStorageReturn<T> {
  const binding = namespace.bind(options.key);
  return useStorage(binding);
}
