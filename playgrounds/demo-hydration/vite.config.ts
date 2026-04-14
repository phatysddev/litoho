import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  plugins: [
    {
      name: "lito-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        if (!options?.ssr && (id.includes("/app/api/") || id.endsWith("/app/api"))) {
          throw new Error(`\n\n[LITO] Protection Error:\nCannot import backend API route '${id}' in a Client context!\n(Imported by ${importer})\n\n`);
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
