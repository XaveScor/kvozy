## AGENTS.md Recursive Reading

If the model opens/reads a file, it also should read all the AGENTS.md's from the file directory and recursively to the root of the project.

### Example

File structure:

```
project-root
|-- AGENTS.md
|-- src
|    |-- modules
|    |    |-- AGENTS.md
|    |    |-- utils
|    |    |    |-- helpers.ts
|    |    |    |-- config.ts
|    |    |-- components
|    |    |    |-- Button.tsx
|    |    |    |-- Modal.tsx
|    |    |    |-- Card.tsx
|    |-- services
|    |    |-- api.ts
|    |    |-- database.ts
|    |-- pages
|         |-- AGENTS.md
|         |-- home
|         |    |-- index.tsx
|         |-- settings
|              |-- profile.tsx
```

If the `src/modules/components/Button.tsx` file is opened:

**Included files (on the path to root):**

- src/modules/components/AGENTS.md (not found)
- src/modules/AGENTS.md
- AGENTS.md

**Not included (off the path):**

- src/pages/AGENTS.md


##

You have to run tests after each task:
```
pnpm test:ci
pnpm test:browser
```
