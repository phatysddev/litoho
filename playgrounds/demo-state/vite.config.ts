import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  resolve: {
    alias: {
      "@lito/app": resolve(__dirname, "../../packages/app/src/index.ts"),
      "@lito/core": resolve(__dirname, "../../packages/core/src/index.ts"),
      "@lito/server": resolve(__dirname, "../../packages/server/src/index.ts")
    }
  },
  optimizeDeps: {
    exclude: ["@lito/app", "@lito/core", "@lito/server"]
  },
  plugins: [
    {
      name: "lito-strip-route-directives",
      enforce: "pre",
      transform(code, id) {
        if (!id.includes("/app/pages/")) {
          return null;
        }

        return {
          code: code.replace(/^(['"])use (client|server)\1;\s*/, ""),
          map: null
        };
      }
    },
    {
      name: "lito-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        if (!options?.ssr && (id.includes("/app/api/") || id.endsWith("/app/api"))) {
          throw new Error(
            `\n\n[LITO] Protection Error:\nCannot import backend API route '${id}' in a Client context!\n(Imported by ${importer})\n\n`
          );
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
