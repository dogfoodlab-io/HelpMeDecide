import react from "@vitejs/plugin-react";
import { defineConfig, type UserConfig } from "vite";

const config = {
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    globals: true,
  },
} as UserConfig & {
  test: {
    environment: string;
    setupFiles: string;
    globals: boolean;
  };
};

export default defineConfig(config);
