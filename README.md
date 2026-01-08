# Kvozy - localStorage Binding Library

Simple, minimal library for encapsulating localStorage logic.

## Overview

Kvozy separates storage logic from React integration:

- **bindValue** - Framework-agnostic core with all localStorage logic
- **useStorage** - Thin React hook wrapper

This architecture makes it easy to add connectors for other frameworks (Vue, Svelte, Angular, etc.) in the future.

## Features

- Framework-agnostic core (bindValue)
- Namespace-based bindings (bindValueNS) for grouping related keys
- Type-safe generic API with custom serialization/deserialization
- Flexible storage support (localStorage, sessionStorage, in-memory)
- Graceful fallback to in-memory storage when storage is unavailable
- Thin React integration (useStorage)
- Real localStorage/backend storage
- Subscription-based reactivity
- TypeScript support
- Required default values for safety
- Schema versioning and migration support
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
- `version` (string, optional) - Schema version for migration support
- `migrate` (function, optional) - Migration function: `(oldSerialized: string, oldVersion: string | undefined) => T`

### useStorage<T>(binding)

React hook that connects a BindValue instance to React state.

**Parameters:**

- `binding` (BindValue<T>, required) - binding instance from bindValue

**Returns:** `{ value, setValue }`

- `value` - `T` - current value from storage
- `setValue` - `(value: T) => void` - function to update value

**Behavior:**

- `subscribe()` does NOT call callback immediately when subscribing
- Callbacks are only invoked when value changes via `set()`
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

## Namespace API

> ⚠️ **Note:** `bindValueNS` is an internal API. Use `useStorageNS` for React components. Direct usage of `bindValueNS` is not recommended.

### BindValueNSOptions<T>

Options for creating a namespace binder. A namespace allows grouping related keys with a shared prefix and configuration.

**Parameters:**

- `prefix` (string, required) - Prefix for all keys in this namespace (cannot be empty or whitespace)
- `defaultValue` (T, required) - Default value shared across all keys in namespace
- `serialize` (function, required) - Convert value to string: `(value: T) => string`
- `deserialize` (function, required) - Convert string to value: `(serialized: string) => T`
- `storage` (Storage, optional) - localStorage, sessionStorage, or undefined for in-memory
- `version` (string, optional) - Schema version for migration support
- `migrate` (function, optional) - Migration function: `(oldSerialized: string, oldVersion: string | undefined) => T`

### bindValueNS<T>(options)

Factory function for creating a namespace binder.

**Returns:** `BindValueNS<T>` instance

**Behavior:**

- Throws error if prefix is empty or whitespace-only
- All bindings created from the namespace share the same configuration
- Keys are combined as `${prefix}\x1F${key}` using Unit Separator

### BindValueNS<T>.bind(key)

Creates a individual binding for a specific key within the namespace.

**Parameters:**

- `key` (string, required) - Key for this specific binding

**Returns:** `BindValue<T>` instance

**Behavior:**

- Throws error if key is empty or whitespace-only
- Combines namespace prefix with key: `${prefix}\x1F${key}`
- Each binding has independent subscribers and state

### useStorageNS<T>(namespace, options)

React hook that connects a namespace to React state with a specific key.

**Parameters:**

- `namespace` (BindValueNS<T>, required) - Namespace instance
- `options: { key: string }` - Key for this specific binding

**Returns:** `{ value, setValue }`

- `value` - `T` - current value from storage
- `setValue` - `(value: T) => void` - function to update value

**Behavior:**

- Creates a binding internally using `namespace.bind(options.key)`
- Delegates to existing `useStorage` hook
- Components using different keys from the same namespace don't share state

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

## Type-Specific Shortcuts

Kvozy provides type-specific shortcuts for common types, eliminating boilerplate and providing sensible defaults. Each shortcut pre-defines serialization/deserialization logic while allowing custom defaults and full feature support.

### Available Shortcuts

| Shortcut           | Type       | Default Value     | Storage Format        |
| ------------------ | ---------- | ----------------- | --------------------- |
| `bindStringValue`  | `string`   | `""`              | String as-is          |
| `bindNumberValue`  | `number`   | `0`               | Decimal string        |
| `bindBooleanValue` | `boolean`  | `false`           | `"true"` or `"false"` |
| `bindJSONValue<T>` | `T`        | User must provide | JSON string           |
| `bindEnumValue<E>` | `E` (enum) | User must provide | String/number as-is   |

### bindStringValue

For string values with identity serialization.

```typescript
import { bindStringValue, useStorage } from "kvozy";

// Default empty string
const nameBinding = bindStringValue({
  key: "name",
});

// Custom default value
const greetingBinding = bindStringValue({
  key: "greeting",
  defaultValue: "Hello",
});

// With versioning
const themeBinding = bindStringValue({
  key: "theme",
  defaultValue: "light",
  version: "2.0.0",
  migrate: (old, oldVersion) => {
    return "dark";
  },
});
```

### bindNumberValue

For numeric values.

```typescript
import { bindNumberValue, useStorage } from "kvozy";

// Default zero
const counterBinding = bindNumberValue({
  key: "counter",
});

// Custom default value
const priceBinding = bindNumberValue({
  key: "price",
  defaultValue: 9.99,
});

// With storage
const scoreBinding = bindNumberValue({
  key: "score",
  defaultValue: 100,
  storage: sessionStorage,
});
```

### bindBooleanValue

For boolean values. Stores as `"true"` or `"false"` for readability in devtools.

```typescript
import { bindBooleanValue, useStorage } from "kvozy";

// Default false
const enabledBinding = bindBooleanValue({
  key: "enabled",
});

// Custom default value
const notificationsBinding = bindBooleanValue({
  key: "notifications",
  defaultValue: true,
});
```

### bindJSONValue<T>

For complex objects and arrays. Requires a default value.

```typescript
import { bindJSONValue, useStorage } from "kvozy";

interface User {
  name: string;
  age: number;
}

// Objects
const userBinding = bindJSONValue<User>({
  key: "user",
  defaultValue: { name: "", age: 0 },
});

// Arrays
const tagsBinding = bindJSONValue<string[]>({
  key: "tags",
  defaultValue: [],
});

// Nested structures
const configBinding = bindJSONValue<{
  theme: { primary: string; secondary: string };
  features: string[];
}>({
  key: "config",
  defaultValue: {
    theme: { primary: "#000", secondary: "#fff" },
    features: [],
  },
});
```

### bindEnumValue<E>

For TypeScript enums. Works with both string and number enums.

```typescript
import { bindEnumValue, useStorage } from "kvozy";

// String enum
enum Color {
  Red = "red",
  Green = "green",
  Blue = "blue",
}

const colorBinding = bindEnumValue<Color>({
  key: "color",
  defaultValue: Color.Blue,
});

// Number enum
enum Priority {
  Low = 1,
  Medium = 2,
  High = 3,
}

const priorityBinding = bindEnumValue<Priority>({
  key: "priority",
  defaultValue: Priority.Low,
});

// With migration
const statusBinding = bindEnumValue<Color>({
  key: "status",
  defaultValue: Color.Red,
  version: "2.0.0",
  migrate: (old, oldVersion) => {
    return Color.Blue;
  },
});
```

## Namespace Type-Specific Shortcuts

Kvozy provides namespace shortcuts for common types, eliminating boilerplate while maintaining the benefits of namespace-based key organization.

| Shortcut             | Type       | Default Value     | Storage Format        |
| -------------------- | ---------- | ----------------- | --------------------- |
| `bindStringValueNS`  | `string`   | `""`              | String as-is          |
| `bindNumberValueNS`  | `number`   | `0`               | Decimal string        |
| `bindBooleanValueNS` | `boolean`  | `false`           | `"true"` or `"false"` |
| `bindJSONValueNS<T>` | `T`        | User must provide | JSON string           |
| `bindEnumValueNS<E>` | `E` (enum) | User must provide | String/number as-is   |

### bindStringValueNS

For string values with identity serialization.

```typescript
import { bindStringValueNS, useStorageNS } from "kvozy";

// Default empty string
const appNS = bindStringValueNS({
  prefix: "app",
  storage: localStorage,
});

// With custom default value
const userNS = bindStringValueNS({
  prefix: "user",
  defaultValue: "guest",
  storage: localStorage,
});

// Use in components
const Component = () => {
  const { value: name, setValue: setName } = useStorageNS(userNS, { key: "name" });
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
};
```

### bindNumberValueNS

For numeric values.

```typescript
import { bindNumberValueNS, useStorageNS } from "kvozy";

const counterNS = bindNumberValueNS({
  prefix: "counters",
  storage: localStorage,
});

const { value: count, setValue: setCount } = useStorageNS(counterNS, {
  key: "views",
});
```

### bindBooleanValueNS

For boolean values. Stores as `"true"` or `"false"` for readability in devtools.

```typescript
import { bindBooleanValueNS, useStorageNS } from "kvozy";

const settingsNS = bindBooleanValueNS({
  prefix: "settings",
  storage: localStorage,
});

const { value: enabled, setValue: setEnabled } = useStorageNS(settingsNS, {
  key: "notifications",
});
```

### bindJSONValueNS<T>

For complex objects and arrays. Requires a default value.

```typescript
import { bindJSONValueNS, useStorageNS } from "kvozy";

interface User {
  name: string;
  email: string;
}

const userNS = bindJSONValueNS<User>({
  prefix: "users",
  defaultValue: { name: "", email: "" },
  storage: localStorage,
});

const { value: user, setValue: setUser } = useStorageNS(userNS, {
  key: "current",
});
```

### bindEnumValueNS<E>

For TypeScript enums. Works with both string and number enums.

```typescript
import { bindEnumValueNS, useStorageNS } from "kvozy";

enum Theme {
  Light = "light",
  Dark = "dark",
}

const settingsNS = bindEnumValueNS<Theme>({
  prefix: "settings",
  defaultValue: Theme.Light,
  storage: localStorage,
});

const { value: theme, setValue: setTheme } = useStorageNS(settingsNS, {
  key: "theme",
});
```

### When to Use Namespaces vs. Individual Bindings

**Use namespaces when:**

- You have multiple related keys (e.g., all user settings)
- You want to share configuration across multiple keys
- You want to organize keys by feature area (user, app, settings)
- You want to avoid repeating serialize/deserialize logic

**Use individual bindings when:**

- You have a single key
- You need different serialization logic per key
- You want maximum flexibility per binding

## Namespace Examples

### Basic Namespace Usage

```typescript
import { bindValueNS, useStorageNS } from 'kvozy';

// Create namespace with shared configuration
const appNS = bindValueNS<string>({
  prefix: 'app',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: localStorage,
});

// Use in component with specific key
const Component = () => {
  const { value, setValue } = useStorageNS(appNS, { key: 'user' });

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
};
// Storage key will be: 'app\x1Fuser'
```

### Multiple Components Sharing Namespace

```typescript
import { bindValueNS, useStorageNS } from 'kvozy';

const appNS = bindValueNS<string>({
  prefix: 'app',
  defaultValue: '',
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: localStorage,
});

const UserSettings = () => {
  const { value: language, setValue: setLanguage } = useStorageNS(appNS, { key: 'language' });
  const { value: theme, setValue: setTheme } = useStorageNS(appNS, { key: 'theme' });

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
    </div>
  );
};
```

### Namespace with Versioning

```typescript
import { bindValueNS, useStorageNS } from "kvozy";

const appNS = bindValueNS<UserData>({
  prefix: "app",
  defaultValue: { name: "", email: "" },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  storage: localStorage,
  version: "2.0.0",
  migrate: (old, oldVersion) => {
    const oldData = JSON.parse(old);
    return { name: oldData.name, email: "" };
  },
});

const { value: user, setValue: setUser } = useStorageNS(appNS, { key: "user" });
```

### Namespace Organization Pattern

Organize your app by creating separate namespaces for different domains:

```typescript
// User-related keys
const userNS = bindValueNS<string>({
  prefix: "user",
  defaultValue: "",
  storage: localStorage,
});

// Application settings keys
const settingsNS = bindValueNS<string>({
  prefix: "settings",
  defaultValue: "",
  storage: localStorage,
});

// Temporary state keys
const tempNS = bindValueNS<string>({
  prefix: "temp",
  defaultValue: "",
  storage: undefined, // in-memory only
});

// Keys will be stored as:
// user\x1Fname', 'user\x1Femail', 'user\x1Ftheme'
// Settings keys: 'settings\x1Fnotifications', 'settings\x1Flanguage', 'settings\x1Ftheme'
// Temp keys: 'temp\x1Fdraft', 'temp\x1Funsaved'
```

## Namespace Isolation

Each namespace maintains complete isolation from other namespaces:

```typescript
const appNS = bindValueNS<string>({
  prefix: "app",
  defaultValue: "",
  storage: localStorage,
});

const userNS = bindValueNS<string>({
  prefix: "user",
  defaultValue: "",
  storage: localStorage,
});

// These are completely isolated:
// appNS.bind('name') stores to 'app\x1Fname'
// userNS.bind('name') stores to 'user\x1Fname'
// No risk of key collisions between namespaces
```

**Benefits:**

- **Organized storage**: Group related keys with meaningful prefixes
- **Collision prevention**: Different prefixes create separate storage domains
- **Shared configuration**: All bindings in a namespace inherit same settings
- **Easy maintenance**: Update settings once for all keys in namespace
- **Clean separation**: Logical boundaries between different app features

### When to Use Shortcuts vs. bindValue

**Use shortcuts when:**

- Working with common types (string, number, boolean, JSON, enum)
- You want less boilerplate
- You don't need custom serialization/deserialization

**Use full `bindValue` when:**

- You have custom serialization/deserialization needs
- Working with non-standard types
- Need maximum flexibility

### Comparison: Before vs. After

**Before (with full API):**

```typescript
const counter = bindValue<number>({
  key: "counter",
  defaultValue: 0,
  serialize: (v) => String(v),
  deserialize: (s) => Number(s),
});
```

**After (with shortcut):**

```typescript
const counter = bindNumberValue({
  key: "counter",
});
```

### Migration Examples

Each shortcut supports versioning and migration just like `bindValue`.

```typescript
// Migrating object structure
const userBinding = bindJSONValue<User>({
  key: "user",
  defaultValue: { name: "", age: 0, email: "" },
  version: "2.0.0",
  migrate: (old, oldVersion) => {
    const oldData = JSON.parse(old);
    return {
      name: oldData.name,
      age: oldData.age ?? 0,
      email: oldData.email ?? "",
    };
  },
});

// Migrating enum values
enum Theme {
  Light = "light",
  Dark = "dark",
  Auto = "auto",
}

const themeBinding = bindEnumValue<Theme>({
  key: "theme",
  defaultValue: Theme.Light,
  version: "2.0.0",
  migrate: (old, oldVersion) => {
    if (oldVersion === "1.0.0" && old === "auto-dark") {
      return Theme.Dark;
    }
    return Theme.Light;
  },
});
```

## Namespace Isolation

Each namespace maintains complete isolation from other namespaces:

```typescript
const appNS = bindValueNS<string>({
  prefix: "app",
  defaultValue: "",
  storage: localStorage,
});

const userNS = bindValueNS<string>({
  prefix: "user",
  defaultValue: "",
  storage: localStorage,
});

// These are completely isolated:
// appNS.bind('name') stores to 'app\x1Fname'
// userNS.bind('name') stores to 'user\x1Fname'
// No risk of key collisions between namespaces
```

**Benefits:**

- **Organized storage**: Group related keys with meaningful prefixes
- **Collision prevention**: Different prefixes create separate storage domains
- **Shared configuration**: All bindings in a namespace inherit same settings
- **Easy maintenance**: Update settings once for all keys in namespace
- **Clean separation**: Logical boundaries between different app features

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

## Schema Versioning and Migration

Kvozy supports schema evolution through optional versioning and migration functions. This allows you to safely update your data structure without breaking existing users' stored data.

### Basic Versioning

```typescript
const userBinding = bindValue<User>({
  key: "user",
  defaultValue: { name: "", age: 0 },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  version: "1.0.0",
});
```

### Migration Example

When you change your data structure, provide a migration function:

```typescript
// Version 1.0.0: stored as string
const themeBindingV1 = bindValue<string>({
  key: "theme",
  defaultValue: "light",
  serialize: (v) => v,
  deserialize: (s) => s,
});

// Version 2.0.0: store as object with additional metadata
const themeBindingV2 = bindValue<{ value: string; lastUpdated: number }>({
  key: "theme",
  defaultValue: { value: "light", lastUpdated: Date.now() },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  version: "2.0.0",
  migrate: (oldSerialized, oldVersion) => {
    if (oldVersion === "1.0.0" || oldVersion === undefined) {
      // Migrate from string to object
      return {
        value: oldSerialized,
        lastUpdated: Date.now(),
      };
    }
    // Fallback to default for unknown versions
    return { value: "light", lastUpdated: Date.now() };
  },
});
```

### Common Migration Patterns

**Add new field:**

```typescript
migrate: (oldSerialized, oldVersion) => {
  const oldData = JSON.parse(oldSerialized);
  return { ...oldData, newField: "default" };
};
```

**Rename field:**

```typescript
migrate: (oldSerialized) => {
  const oldData = JSON.parse(oldSerialized);
  return { newName: oldData.oldName };
};
```

**Change data type:**

```typescript
migrate: (oldSerialized) => {
  const dateString = oldSerialized;
  return { date: new Date(dateString) };
};
```

### Migration Behavior

- When `version` is provided, values are stored with a version prefix
- On load, if versions mismatch, the `migrate` function is called
- If `migrate` is undefined or fails, the `defaultValue` is used
- Old data is automatically cleaned up when using default fallback
- Migration receives the raw serialized string (not deserialized)
- Migration failures are handled silently

This ensures your application works even when users have old data formats, and new users get the default structure.

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

### Namespace-Based Organization

Organize your app by creating separate namespaces for different domains:

```typescript
// User-related keys
const userNS = bindValueNS<string>({
  prefix: 'user',
  defaultValue: '',
  storage: localStorage,
});

// Application settings keys
const settingsNS = bindValueNS<string>({
  prefix: 'settings',
  defaultValue: '',
  storage: localStorage,
});

const UserPreferences = () => {
  const { value: language, setValue: setLanguage } = useStorageNS(userNS, { key: 'language' });
  const { value: notificationsEnabled, setValue: setNotifications } = useStorageNS(settingsNS, { key: 'notifications' });

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
      <button onClick={() => setNotifications(!notificationsEnabled)}>
        {notificationsEnabled ? 'Disable' : 'Enable'} Notifications
      </button>
    </div>
  );
};

// User keys: 'user\x1Flanguage', 'user\x1Femail', 'user\x1Ftheme'
// Settings keys: 'settings\x1Fnotifications', 'settings\x1Flanguage', 'settings\x1Ftheme'
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

### Namespace: BindValueNS

Namespace binder for grouping related keys with shared configuration:

- Manages namespace configuration (prefix, defaultValue, serialize, deserialize)
- Provides `bind(key)` method to create individual `BindValue` instances
- Combines prefix and key using Unit Separator: `${prefix}\x1F${key}`
- Validates prefix and key are not empty/whitespace
- Creates isolated storage domains for different prefixes

```typescript
class BindValueNS<T> {
  bind(key: string): BindValue<T>;
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
- **Namespace state isolation**: Components using the same namespace but different keys don't share React state. Each `useStorageNS(namespace, { key: 'x' })` call creates an independent binding.

## Future Plans

- [ ] Vue connector (`useStorageVue`)
- [ ] Svelte connector (`useStorageSvelte`)
- [ ] Angular connector
- [ ] SSR support
- [ ] Cross-tab synchronization
- [ ] Console warnings on serialization/deserialization errors for debugging
