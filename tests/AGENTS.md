## Tests Organization

This directory contains all tests for the project, organized by test type:

### Directory Structure

- **unitTests/** - Unit tests for pure functions, utilities, and non-React code
- **browserTests/** - React component tests and browser integration tests

### Test Guidelines

- Unit tests should be located in `unitTests/`
- React tests should be located in `browserTests/`

### File Organization Rule

The agent should save each logical chunk of tests inside a new file. This allows the agent to save context tokens and make the files smaller.

**Examples:**

- Testing a single utility function → create a dedicated test file
- Testing different scenarios/features of a component → split into separate test files by feature
- Testing multiple related utility functions → group logically, but keep files focused and reasonably sized

This approach improves:

- Test file readability and maintainability
- Agent context efficiency when working with tests
- Parallel test execution performance
- Easier test debugging and isolation
