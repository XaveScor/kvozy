import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unitTests/**/*.test.ts"],
    environment: "node",
  },
});
