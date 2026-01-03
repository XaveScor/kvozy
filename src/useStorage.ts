import { useState, useEffect } from "react";
import { type BindValue } from "./bindValue.js";

export interface UseStorageReturn {
  value: string | undefined;
  setValue: (value: string) => void;
}

export function useStorage(binding: BindValue): UseStorageReturn {
  const [value, setValue] = useState(binding.getValue());

  useEffect(() => {
    const unsubscribe = binding.subscribe(setValue);
    return unsubscribe;
  }, [binding]);

  const set = (newValue: string) => {
    binding.set(newValue);
  };

  return { value, setValue: set };
}
