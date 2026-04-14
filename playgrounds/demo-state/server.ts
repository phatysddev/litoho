import { scanApiRoutesFromManifest, scanPageRoutesFromManifest } from "@lito/app";
import { startLitoNodeApp } from "@lito/server";
import { resolve } from "node:path";
import { apiModulePaths } from "./src/generated/api-manifest";
import { pageManifest } from "./src/generated/page-manifest";

const manifestBaseUrl = new URL("./src/generated/", import.meta.url);
const pages = await scanPageRoutesFromManifest({
  manifestBaseUrl,
  pageManifest
});
const apiRoutes = await scanApiRoutesFromManifest({
  manifestBaseUrl,
  apiModulePaths
});

await startLitoNodeApp({
  appName: "Lito Demo State",
  rootDir: resolve(process.cwd()),
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  port: Number(process.env.PORT ?? 3000),
  pages,
  apiRoutes
});

console.log(`Lito demo-state is running at http://localhost:${process.env.PORT ?? 3000}`);
