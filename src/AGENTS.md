# Kvozy - Development Guidelines

## Project Overview

Kvozy is a minimal React library for binding localStorage keys to React state. The library follows a clean architecture where all storage logic is framework-agnostic and lives in `bindValue`, while React integration is a thin wrapper in `useStorage`.

## Core Architecture Principles

### 1. Separation of Concerns

- **bindValue** (`src/bindValue.ts`) - All business logic, localStorage operations, and subscription system
- **useStorage** (`src/useStorage.ts`) - Thin React wrapper that only connects React state to bindValue subscriptions
- **index.ts** (`src/index.ts`) - Public API exports

### 2. Framework-Agnostic Core

The `bindValue` class must be completely framework-agnostic. All storage logic lives here to enable future connectors for Vue, Svelte, Angular, etc.

### 3. Thin React Layer

The `useStorage` hook should only:

- Subscribe to bindValue changes on mount
- Unsubscribe on unmount
- Manage React state
- Return `{ value, setValue }`
- No additional business logic

## File Structure and Responsibilities

```
kvozy/
├── src/
│   ├── AGENTS.md          # This file - development guidelines
│   ├── bindValue.ts       # Core logic (strings only, localStorage only)
│   ├── useStorage.ts      # React hook (thin wrapper)
│   └── index.ts           # Public API exports
├── unitTests/
│   └── bindValue.test.ts  # Node tests for bindValue (mocked localStorage)
└── browserTests/
    └── useStorage.test.ts # Browser tests for React (Playwright)
```

## Code Style Guidelines

### Type-Safe Generic API

- Generic type parameter `<T>` for type safety
- Custom serialize/deserialize functions for any data type
- Required defaultValue for safety
- Keep API simple and predictable

### Flexible Storage

- Optional storage parameter (Storage type)
- Supports localStorage, sessionStorage, or in-memory
- In-memory storage when storage is omitted or undefined
- Unit tests use simple mock storage
- Browser tests test all three storage types

### Undefined Handling

- Return `undefined` when storage key doesn't exist
- Don't throw errors for missing keys
- Handle undefined gracefully in React layer

### Subscription System

- Use `Set` to track subscribers
- Return unsubscribe function from `subscribe()`
- Notify all subscribers when value changes via `set()`

## Testing Strategy

### Unit Tests (Node Environment)

- **Location**: `unitTests/bindValue.test.ts`
- **Purpose**: Test `bindValue` class logic
- **Environment**: Node (no real DOM)
- **Storage**: Pass mock storage explicitly to each test

**Test Coverage Requirements**:

- ✓ Creates BindValue instance with mock storage
- ✓ Loads initial value from mock storage
- ✓ `getValue()` returns current value
- ✓ `getValue()` returns `undefined` when key doesn't exist
- ✓ `set()` updates mock storage and internal value
- ✓ `subscribe()` receives updates on `set()`
- ✓ `subscribe()` returns working unsubscribe function
- ✓ Multiple subscribers receive updates
- ✓ Unsubscribed callback doesn't receive updates
- ✓ `subscribe()` does NOT call callback immediately (only on value changes)
- ✓ Callbacks are only invoked on value changes, not on subscription
- ✓ Works with in-memory storage (no storage parameter)
- ✓ Works with explicit `storage: undefined`
- ✓ Data persists across instances with same key (in-memory storage)

**Mock Storage Helper**:

```typescript
function createMockStorage(): Storage {
  const mockStorage = new Map<string, string>();

  return {
    get length() {
      return mockStorage.size;
    },
    clear() {
      mockStorage.clear();
    },
    getItem(key: string) {
      return mockStorage.get(key) ?? null;
    },
    key(index: number) {
      const keys = Array.from(mockStorage.keys());
      return keys[index] ?? null;
    },
    removeItem(key: string) {
      mockStorage.delete(key);
    },
    setItem(key: string, value: string) {
      mockStorage.set(key, value);
    },
  };
}
```

### Browser Tests (Playwright)

- **Location**: `browserTests/useStorage.test.ts`
- **Purpose**: Test React integration with all storage types
- **Environment**: Real browser (Chrome, Firefox, Webkit)
- **Tools**: Vitest browser mode with Playwright provider

**Test Coverage Requirements**:

**localStorage Tests:**

- ✓ `useStorage` returns `{ value, setValue }`
- ✓ Initial value from bindValue
- ✓ Component re-renders on `setValue` call
- ✓ Multiple components sharing same bindValue sync
- ✓ Unsubscribe on component unmount
- ✓ Real localStorage integration across browsers

**sessionStorage Tests:**

- ✓ All same tests as localStorage
- ✓ Verify data persists within tab but not across tabs

**In-Memory Storage Tests:**

- ✓ All same tests as localStorage
- ✓ Data does NOT persist across page reloads
- ✓ Data persists across instances with same key

## Build Process

### Smartbundle

- Build tool: `smartbundle`
- Entry point: `src/index.ts`
- Output: `dist/` directory
- Run with: `npm run build`

### Exports

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

## API Design

### BindValueOptions<T>

```typescript
interface BindValueOptions<T> {
  key: string;
  defaultValue: T;
  serialize: (value: T) => string;
  deserialize: (serialized: string) => T;
  storage?: Storage; // localStorage, sessionStorage, or undefined for in-memory
  version?: string; // Optional version for schema evolution
  migrate?: (oldSerialized: string, oldVersion: string | undefined) => T; // Migration function
}
```

### BindValue<T> Class

```typescript
class BindValue<T> {
  constructor(options: BindValueOptions<T>);
  getValue(): T;
  set(value: T): void;
  subscribe(callback: (value: T) => void): () => void;
}
```

### bindValue<T> Function

```typescript
function bindValue<T>(options: BindValueOptions<T>): BindValue<T>;
```

### UseStorageReturn<T>

```typescript
interface UseStorageReturn<T> {
  value: T;
  setValue: (value: T) => void;
}
```

### useStorage<T> Hook

```typescript
function useStorage<T>(binding: BindValue<T>): UseStorageReturn<T>;
```

## Versioning and Migration

Kvozy supports schema evolution through optional versioning and migration functions.

### Storage Format

- **No version**: Stores only the serialized value (backwards compatible)
- **With version**: Stores `\x00<version>\x00<serializedValue>` using null byte separator

### Versioning Behavior

1. **When version is undefined**: Behaves like before, stores only serialized value
2. **When version is defined**: Stores with version prefix
3. **On load**: Compares stored version with current version
4. **Version mismatch**:
   - If `migrate` is defined: Calls `migrate(oldSerialized, oldVersion)`, stores result with new version
   - If `migrate` is undefined or migration fails: Uses `defaultValue`, clears old value from storage
5. **Version match**: Deserializes normally

### Migration Function Signature

```typescript
migrate?: (oldSerialized: string, oldVersion: string | undefined) => T
```

- Receives the raw serialized string from storage (not deserialized)
- Receives the old version string, or `undefined` for unversioned data
- Must return a value of type `T`
- Migration failures are handled silently (falls back to `defaultValue`)

### Versioning Examples

```typescript
// Simple versioning without migration
const userBinding = bindValue<{ name: string }>({
  key: "user",
  defaultValue: { name: "" },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  version: "1.0.0",
  storage: localStorage,
});

// Versioning with migration from old format
const settingsBinding = bindValue<{ theme: string; language: string }>({
  key: "settings",
  defaultValue: { theme: "light", language: "en" },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  version: "2.0.0",
  migrate: (oldSerialized, oldVersion) => {
    if (oldVersion === "1.0.0") {
      // Migrate from version 1.0.0 (just theme string) to 2.0.0 (object)
      const theme = oldSerialized;
      return { theme, language: "en" };
    }
    // Fallback for unversioned data
    return { theme: "light", language: "en" };
  },
  storage: localStorage,
});

// Migration from unversioned data
const counterBinding = bindValue<{ count: number; max: number }>({
  key: "counter",
  defaultValue: { count: 0, max: 100 },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
  version: "1.0.0",
  migrate: (oldSerialized, oldVersion) => {
    // oldVersion is undefined for unversioned data
    if (oldVersion === undefined) {
      const count = Number(oldSerialized);
      return { count, max: 100 };
    }
    return { count: 0, max: 100 };
  },
  storage: localStorage,
});
```

### Migration Patterns

**Pattern 1: Add new field**

```typescript
// Old: string
// New: { value: string, timestamp: number }
migrate: (oldSerialized) => ({
  value: oldSerialized,
  timestamp: Date.now(),
});
```

**Pattern 2: Rename field**

```typescript
// Old: { username: string }
// New: { name: string }
migrate: (oldSerialized) => {
  const oldData = JSON.parse(oldSerialized);
  return { name: oldData.username };
};
```

**Pattern 3: Change type**

```typescript
// Old: string "2023-01-01"
// New: { date: Date, formatted: string }
migrate: (oldSerialized) => {
  const date = new Date(oldSerialized);
  return {
    date,
    formatted: date.toISOString(),
  };
};
```

**Pattern 4: Multi-version migration**

```typescript
migrate: (oldSerialized, oldVersion) => {
  if (oldVersion === "1.0.0") {
    return migrateFrom1to2(oldSerialized);
  }
  if (oldVersion === "2.0.0") {
    return migrateFrom2to3(oldSerialized);
  }
  return defaultValue; // Fallback
};
```

## Storage Usage Examples

```typescript
// Number type
const counterBinding = bindValue<number>({
  key: "counter",
  defaultValue: 0,
  serialize: (v) => String(v),
  deserialize: (s) => Number(s),
});

// Object type
interface User {
  name: string;
  age: number;
}
const userBinding = bindValue<User>({
  key: "user",
  defaultValue: { name: "", age: 0 },
  serialize: (v) => JSON.stringify(v),
  deserialize: (s) => JSON.parse(s),
});

// localStorage - persists across browser sessions
const localBinding = bindValue<number>({
  key: "theme",
  defaultValue: 0,
  serialize: (v) => String(v),
  deserialize: (s) => Number(s),
  storage: localStorage,
});

// sessionStorage - persists within the same tab
const sessionBinding = bindValue<string>({
  key: "form-data",
  defaultValue: "",
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: sessionStorage,
});

// In-memory - no persistence, graceful fallback
const memoryBinding = bindValue<boolean>({
  key: "temp-state",
  defaultValue: false,
  serialize: (v) => String(v),
  deserialize: (s) => s === "true",
});

// Graceful fallback when localStorage is unavailable (e.g., incognito mode)
const safeBinding = bindValue<string>({
  key: "some-key",
  defaultValue: "",
  serialize: (v) => v,
  deserialize: (s) => s,
  storage: localStorage ?? undefined,
});
```

## Development Workflow

1. **Make changes** to source files
2. **Run unit tests**: `npm test`
3. **Run browser tests**: `npm run test:browser`
4. **Run linter** (if configured): `npm run lint`
5. **Run typecheck**: `npm run typecheck`
6. **Build**: `npm run build`

## Future Extensibility

The architecture is designed for easy framework connectors. When adding new frameworks:

### Pattern for New Framework Connectors

1. Import `BindValue` class from `bindValue.ts`
2. Create thin wrapper that:
   - Subscribes to bindValue changes on mount
   - Unsubscribes on unmount
   - Manages framework-specific state
   - Returns `{ value, setValue }` or equivalent
3. Export from framework-specific file

### Example: Vue Connector

```typescript
// useStorageVue.ts
import { ref, onMounted, onUnmounted } from "vue";
import { type BindValue } from "./bindValue";

export function useStorageVue<T>(binding: BindValue<T>) {
  const value = ref(binding.getValue());

  onMounted(() => {
    binding.subscribe((newValue: T) => (value.value = newValue));
  });

  const setValue = (newValue: T) => binding.set(newValue);

  return { value, setValue };
}
```

## Common Pitfalls

1. **Don't add logic to useStorage** - Keep it thin, all logic in bindValue
2. **Don't forget to unsubscribe** - Always return cleanup from useEffect
3. **Don't mock localStorage in browser tests** - Use real browser localStorage
4. **Don't add dependencies** - Keep minimal, only React peer dependency
5. **Always provide defaultValue** - Required for type safety and error handling
6. **Remember serialize can fail silently** - In-memory value is kept but storage not updated

## Testing Commands

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm test -- --watch

# Run browser tests (Playwright)
npm run test:browser

# Run browser tests on specific browser
npm run test:browser -- --browser chromium
npm run test:browser -- --browser firefox
npm run test:browser -- --browser webkit

# Build library
npm run build
```

## Commit Guidelines

When committing changes, follow conventional commits:

- `feat: add new feature`
- `fix: fix bug`
- `docs: update documentation`
- `test: add/update tests`
- `refactor: refactor code`
- `chore: update build/config`
