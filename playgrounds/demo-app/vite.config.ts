import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  build: {
    manifest: "manifest.json"
  }
});
