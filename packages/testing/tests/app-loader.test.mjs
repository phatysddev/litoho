import test from "node:test";
import assert from "node:assert/strict";
import { createTempLitoProject } from "../dist/index.js";
import { loadLitoAppFromManifest } from "../../app/dist/index.js";

test("loadLitoAppFromManifest auto-loads special app pages by convention", async () => {
  const project = createTempLitoProject({
    "app/pages/_index.mjs": "export default { render: () => 'home' };\n",
    "app/pages/_not-found.mjs": "export default { render: () => 'missing' };\n",
    "app/pages/_error.mjs": "export default { render: () => 'error' };\n",
    "app/api/health.mjs": "export function get() { return Response.json({ ok: true }); }\n",
    "app/api/_middleware.mjs": "export default async function middleware(context, next) { context.setLocal(\"fromApiMiddleware\", true); await next(); };\n",
    "src/generated/.gitkeep": ""
  });

  try {
    const manifestBaseUrl = new URL(`file://${project.rootDir}/src/generated/`);
    const app = await loadLitoAppFromManifest({
      manifestBaseUrl,
      pageManifest: [
        {
          page: () => import(new URL("../../app/pages/_index.mjs", manifestBaseUrl).href),
          layouts: [],
          routeId: "index",
          routePath: "/"
        }
      ],
      apiModulePaths: ["../../app/api/health.mjs"],
      notFoundPagePath: "../../app/pages/_not-found.mjs",
      errorPagePath: "../../app/pages/_error.mjs",
      apiMiddlewarePath: "../../app/api/_middleware.mjs"
    });

    assert.equal(app.pages.length, 1);
    assert.equal(app.apiRoutes.length, 1);
    assert.ok(app.notFoundPage);
    assert.ok(app.errorPage);
    assert.equal(app.middlewares.length, 1);
  } finally {
    project.cleanup();
  }
});

test("loadLitoAppFromManifest maps page manifest mode to client route mode", async () => {
  const project = createTempLitoProject({
    "app/pages/_index.mjs": "\"use client\";\nexport default { render: () => 'client-home' };\n",
    "src/generated/.gitkeep": ""
  });

  try {
    const manifestBaseUrl = new URL(`file://${project.rootDir}/src/generated/`);
    const app = await loadLitoAppFromManifest({
      manifestBaseUrl,
      pageManifest: [
        {
          page: () => import(new URL("../../app/pages/_index.mjs", manifestBaseUrl).href),
          layouts: [],
          routeId: "index",
          routePath: "/",
          mode: "client"
        }
      ],
      apiModulePaths: []
    });

    assert.equal(app.pages.length, 1);
    assert.equal(app.pages[0].mode, "client");
  } finally {
    project.cleanup();
  }
});
