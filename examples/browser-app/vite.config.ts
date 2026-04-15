import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  plugins: [
    {
      name: "litoho-strip-route-directives",
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
      name: "litoho-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        const isApiRouteImport = id.includes("/app/api/") || id.endsWith("/app/api");
        const isClientModuleImporter = typeof importer === "string" && /[.][cm]?[jt]sx?$/.test(importer);
        if (!options?.ssr && isApiRouteImport && isClientModuleImporter) {
          throw new Error(`\n\n[LITOHO] Protection Error:\nCannot import backend API route '${id}' in a Client context!\n(Imported by ${importer})\n\n`);
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
