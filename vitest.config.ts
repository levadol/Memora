import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["**/node_modules/**", "**/e2e/**"],
    coverage: {
      provider: "v8",
      include: [
        "src/lib/games/**",
        "src/lib/hooks/**",
        "src/lib/storage/**",
        "src/lib/scheduler/**",
        "src/lib/streak.ts",
        "src/lib/achievements.ts",
        "src/lib/store/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
