import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["unitTests/**/*.test.ts"],
    environment: "node",
  },
});
