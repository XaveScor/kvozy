# Kvozy - React localStorage Binding Library

Simple, minimal React library for binding localStorage keys to React state.

## Overview

Kvozy separates storage logic from React integration:

- **bindValue** - Framework-agnostic core with all localStorage logic
- **useStorage** - Thin React hook wrapper

This architecture makes it easy to add connectors for other frameworks (Vue, Svelte, Angular, etc.) in the future.

## Features

- Framework-agnostic core (bindValue)
- Flexible storage support (localStorage, sessionStorage, in-memory)
- Graceful fallback to in-memory storage when storage is unavailable
- Thin React integration (useStorage)
- String-only values (simple, predictable)
- Real localStorage/backend storage
- Subscription-based reactivity
- TypeScript support
- Easy to extend to other frameworks

## Installation

```bash
npm install kvozy
```

## Quick Start

> ⚠️ **Note:** `bindValue` is an internal API. Use `useStorage` for React components. Direct usage of `bindValue` is not recommended.

```typescript
import { bindValue, useStorage } from 'kvozy';

// Define the binding
const myValue = bindValue({ key: 'my-key' });

// Use in component
const Component = () => {
  const { value, setValue } = useStorage(myValue);

  return <input value={value || ''} onChange={(e) => setValue(e.target.value)} />;
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

### useStorage(binding)

React hook that connects a BindValue instance to React state.

**Parameters:**

- `binding` (BindValue, required) - binding instance from bindValue

**Returns:** `{ value, setValue }`

- `value` - `string | undefined` - current value from localStorage
- `setValue` - `(value: string) => void` - function to update value

**Behavior:**

- `subscribe()` does NOT call the callback immediately when subscribing
- Callbacks are only invoked when the value changes via `set()`

**Example:**

```typescript
const Component = () => {
  const { value, setValue } = useStorage(myBinding);

  return <div>
    <p>Current value: {value || '(empty)'}</p>
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

const usernameBinding = bindValue({ key: 'username' });

const LoginForm = () => {
  const { value, setValue } = useStorage(usernameBinding);

  return (
    <div>
      <label>
        Username:
        <input
          value={value || ''}
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

const themeBinding = bindValue({ key: 'theme' });

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

When a localStorage key doesn't exist, `getValue()` and `useStorage` return `undefined`:

```typescript
const binding = bindValue({ key: 'non-existent-key' });
console.log(binding.getValue()); // undefined

const Component = () => {
  const { value } = useStorage(binding);
  return <div>{value || 'No value set'}</div>;
};
```

### Using Different Storage Types

Kvozy supports localStorage, sessionStorage, and in-memory storage:

```typescript
import { bindValue, useStorage } from 'kvozy';

// localStorage - persists across browser sessions
const localBinding = bindValue({ key: 'theme', storage: localStorage });

// sessionStorage - persists within the same tab
const sessionBinding = bindValue({ key: 'form-data', storage: sessionStorage });

// In-memory - no persistence, graceful fallback
const memoryBinding = bindValue({ key: 'temp-state' });

const LocalComponent = () => {
  const { value, setValue } = useStorage(localBinding);
  return <div>Theme: {value || 'light'}</div>;
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
const formBinding = bindValue({ key: 'form-data' });

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
const counterBinding = bindValue({ key: 'counter' });

const Counter = () => {
  const { value, setValue } = useStorage(counterBinding);
  const count = parseInt(value || '0', 10);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setValue(String(count + 1))}>
        Increment
      </button>
      <button onClick={() => setValue(String(count - 1))}>
        Decrement
      </button>
      <button onClick={() => setValue('0')}>
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
- Manages localStorage operations
- Handles subscriptions
- Can be used with any UI framework

```typescript
class BindValue {
  private value: string | undefined;
  private subscribers: Set<(value: string | undefined) => void>;

  getValue(): string | undefined;
  set(value: string): void;
  subscribe(callback): () => void;
}
```

### React: useStorage

Thin wrapper that connects `bindValue` to React:

- Subscribes to changes on mount
- Unsubscribes on unmount
- Manages React state with `useState`
- Returns `{ value, setValue }`

```typescript
function useStorage(binding: BindValue): UseStorageReturn {
  const [value, setValue] = useState(binding.getValue());

  useEffect(() => {
    const unsubscribe = binding.subscribe(setValue);
    return unsubscribe;
  }, [binding]);

  const set = (newValue: string) => binding.set(newValue);

  return { value, setValue: set };
}
```

## Limitations

- **String-only values**: Kvozy only supports string values. For objects or arrays, serialize them as JSON.
- **No SSR support**: Currently designed for client-side only (requires `window.localStorage`).
- **No cross-tab sync**: Changes in one tab don't update other tabs automatically.

## Future Plans

- [ ] Vue connector (`useStorageVue`)
- [ ] Svelte connector (`useStorageSvelte`)
- [ ] Angular connector
- [ ] SSR support
- [ ] Cross-tab synchronization
