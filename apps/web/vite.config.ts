import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: { host: "127.0.0.1", port: 5181, strictPort: true },
  preview: { host: "127.0.0.1", port: 5181, strictPort: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
