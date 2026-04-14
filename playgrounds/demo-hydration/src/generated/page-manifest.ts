import type { LitoPageManifestEntry } from "@lito/app";

export const pageManifest: LitoPageManifestEntry[] = [
  {
    page: () => import("../../app/pages/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "index",
    routePath: "/"
  },
  {
    page: () => import("../../app/pages/csr-page/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "csr-page",
    routePath: "/csr-page",
    mode: "client"
  },
  {
    page: () => import("../../app/pages/ssr-page/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "ssr-page",
    routePath: "/ssr-page",
    mode: "server"
  }
];
