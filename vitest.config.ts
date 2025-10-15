import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "html"],
    },
    server: {
      deps: {
        inline: ["@mui/x-data-grid"],
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "@mui/x-data-grid/esm/index.css": fileURLToPath(new URL("./tests/styleMock.ts", import.meta.url)),
    },
  },
});
