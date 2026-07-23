import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run in Node so express/supertest work; default jsdom would break.
    environment: "node",
    include: ["test/**/*.test.ts"],
    globals: false,
  },
});
