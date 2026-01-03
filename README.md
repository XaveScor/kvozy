# Kvozy - React localStorage Binding Library

Simple, minimal React library for binding localStorage keys to React state.

## Overview

Kvozy separates storage logic from React integration:

- **bindValue** - Framework-agnostic core with all localStorage logic
- **useStorage** - Thin React hook wrapper

This architecture makes it easy to add connectors for other frameworks (Vue, Svelte, Angular, etc.) in the future.

## Features

- Framework-agnostic core (bindValue)
- Type-safe generic API with custom serialization/deserialization
- Flexible storage support (localStorage, sessionStorage, in-memory)
- Graceful fallback to in-memory storage when storage is unavailable
- Thin React integration (useStorage)
- Real localStorage/backend storage
- Subscription-based reactivity
- TypeScript support
- Required default values for safety
- Easy to extend to other frameworks

## Installation

```bash
npm install kvozy
```

## Quick Start

> ⚠️ **Note:** `bindValue` is an internal API. Use `useStorage` for React components. Direct usage of `bindValue` is not recommended.

```typescript
import { bindValue, useStorage } from 'kvozy';

// Define the binding with type, serialize, deserialize, and defaultValue
const myValue = bindValue<string>({
  key: 'my-key',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
});

// Use in component
const Component = () => {
  const { value, setValue } = useStorage(myValue);

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
};
```

## Why In-Memory Storage?

In-memory storage provides a graceful fallback when persistent storage is unavailable, such as:

- **Incognito/Private Mode**: Some browsers disable localStorage in private browsing
- **Storage Quota Exceeded**: When storage limits are reached
- **Cookie/Storage Disabled**: When users have disabled cookies/storage

```typescript
// This code works even if localStorage is unavailable (e.g., incognito mode)
const bindedValue = bindValue({
  key: "some-key",
  storage: localStorage ?? undefined,
});
// Falls back to in-memory storage, so your code continues to work
```

The in-memory storage ensures your application remains functional, maintaining session state without throwing errors or breaking your user experience.

## API Reference

> ⚠️ **Note:** `bindValue` is an internal API. Use `useStorage` for React components. Direct usage of `bindValue` is not recommended.

### BindValueOptions<T>

Options for creating a BindValue instance.

**Parameters:**

- `key` (string, required) - Storage key
- `defaultValue` (T, required) - Default value when key doesn't exist or deserialize fails
- `serialize` (function, required) - Convert value to string: `(value: T) => string`
- `deserialize` (function, required) - Convert string to value: `(serialized: string) => T`
- `storage` (Storage, optional) - localStorage, sessionStorage, or undefined for in-memory

### useStorage<T>(binding)

React hook that connects a BindValue instance to React state.

**Parameters:**

- `binding` (BindValue<T>, required) - binding instance from bindValue

**Returns:** `{ value, setValue }`

- `value` - `T` - current value from storage
- `setValue` - `(value: T) => void` - function to update value

**Behavior:**

- `subscribe()` does NOT call the callback immediately when subscribing
- Callbacks are only invoked when the value changes via `set()`
- If `serialize()` fails, in-memory value is kept but storage is NOT updated
- If `deserialize()` fails, `defaultValue` is returned

**Example:**

```typescript
const Component = () => {
  const { value, setValue } = useStorage(myBinding);

  return <div>
    <p>Current value: {value}</p>
    <button onClick={() => setValue('new value')}>
      Update Value
    </button>
  </div>;
};
```

## Usage Examples

### Basic Usage

```typescript
import { bindValue, useStorage } from 'kvozy';

const usernameBinding = bindValue<string>({
  key: 'username',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
});

const LoginForm = () => {
  const { value, setValue } = useStorage(usernameBinding);

  return (
    <div>
      <label>
        Username:
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </label>
    </div>
  );
};
```

### Multiple Components Sharing State

```typescript
import { bindValue, useStorage } from 'kvozy';

const themeBinding = bindValue<string>({
  key: 'theme',
  defaultValue: 'light',
  serialize: (v) => v,
  deserialize: (s) => s,
});

const ThemeToggle = () => {
  const { value, setValue } = useStorage(themeBinding);

  return (
    <button onClick={() => setValue(value === 'dark' ? 'light' : 'dark')}>
      Switch to {value === 'dark' ? 'Light' : 'Dark'} Mode
    </button>
  );
};

const ThemeDisplay = () => {
  const { value } = useStorage(themeBinding);

  return <p>Current theme: {value}</p>;
};

const App = () => (
  <div>
    <ThemeToggle />
    <ThemeDisplay />
  </div>
);
```

Both components stay in sync automatically!

### Handling Undefined Values

When a localStorage key doesn't exist, `defaultValue` is returned:

```typescript
const binding = bindValue<string>({
  key: 'non-existent-key',
  defaultValue: 'default value',
  serialize: (v) => v,
  deserialize: (s) => s,
});
console.log(binding.getValue()); // 'default value'

const Component = () => {
  const { value } = useStorage(binding);
  return <div>{value}</div>;
};
```

### Using Different Storage Types

Kvozy supports localStorage, sessionStorage, and in-memory storage:

```typescript
import { bindValue, useStorage } from 'kvozy';

// localStorage - persists across browser sessions
const localBinding = bindValue<string>({
  key: 'theme',
  defaultValue: 'light',
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: localStorage,
});

// sessionStorage - persists within the same tab
const sessionBinding = bindValue<string>({
  key: 'form-data',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: sessionStorage,
});

// In-memory - no persistence, graceful fallback
const memoryBinding = bindValue<string>({
  key: 'temp-state',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
});

const LocalComponent = () => {
  const { value, setValue } = useStorage(localBinding);
  return <div>Theme: {value}</div>;
};

const SessionComponent = () => {
  const { value, setValue } = useStorage(sessionBinding);
  return <div>Form data: {value || 'empty'}</div>;
};

const MemoryComponent = () => {
  const { value, setValue } = useStorage(memoryBinding);
  return <div>Temp: {value || 'empty'}</div>;
};
```

### Persisting Form Data

```typescript
const formBinding = bindValue<string>({
  key: 'form-data',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
});

const Form = () => {
  const { value, setValue } = useStorage(formBinding);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    setValue(JSON.stringify(data));
  };

  const formData = value ? JSON.parse(value) : {};

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" defaultValue={formData.name || ''} />
      <input name="email" defaultValue={formData.email || ''} />
      <button type="submit">Save</button>
    </form>
  );
};
```

### Counter Example

```typescript
const counterBinding = bindValue<number>({
  key: 'counter',
  defaultValue: 0,
  serialize: (v) => String(v),
  deserialize: (s) => Number(s),
});

const Counter = () => {
  const { value, setValue } = useStorage(counterBinding);

  return (
    <div>
      <p>Count: {value}</p>
      <button onClick={() => setValue(value + 1)}>
        Increment
      </button>
      <button onClick={() => setValue(value - 1)}>
        Decrement
      </button>
      <button onClick={() => setValue(0)}>
        Reset
      </button>
    </div>
  );
};
```

## Architecture

### Core: bindValue

All storage logic lives in `bindValue` class:

- Framework-agnostic
- Type-safe generic API
- Manages localStorage operations
- Handles subscriptions
- Can be used with any UI framework

```typescript
class BindValue<T> {
  private value: T;
  private subscribers: Set<(value: T) => void>;

  getValue(): T;
  set(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
}
```

### React: useStorage

Thin wrapper that connects `bindValue` to React:

- Subscribes to changes on mount
- Unsubscribes on unmount
- Manages React state with `useState`
- Returns `{ value, setValue }`

```typescript
function useStorage<T>(binding: BindValue<T>): UseStorageReturn<T> {
  const [value, setValue] = useState(binding.getValue());

  useEffect(() => {
    const unsubscribe = binding.subscribe(setValue);
    return unsubscribe;
  }, [binding]);

  const set = (newValue: T) => binding.set(newValue);

  return { value, setValue: set };
}
```

## Limitations

- **No SSR support**: Currently designed for client-side only (requires `window.localStorage`).
- **No cross-tab sync**: Changes in one tab don't update other tabs automatically.
- **Serialize failures**: If `serialize()` fails, the value is kept in memory but not persisted to storage (graceful degradation).

## Future Plans

- [ ] Vue connector (`useStorageVue`)
- [ ] Svelte connector (`useStorageSvelte`)
- [ ] Angular connector
- [ ] SSR support
- [ ] Cross-tab synchronization
- [ ] Console warnings on serialization/deserialization errors for debugging
