import type { LitoPageManifestEntry } from "@lito/app";

export const pageManifest: LitoPageManifestEntry[] = [
  {
    page: () => import("../../app/pages/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "index",
    routePath: "/"
  },
  {
    page: () => import("../../app/pages/counter/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "counter",
    routePath: "/counter",
    mode: "client"
  },
  {
    page: () => import("../../app/pages/server-data/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "server-data",
    routePath: "/server-data",
    mode: "server"
  },
  {
    page: () => import("../../app/pages/store/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "store",
    routePath: "/store",
    mode: "client"
  },
  {
    page: () => import("../../app/pages/todos/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "todos",
    routePath: "/todos",
    mode: "client"
  }
];
