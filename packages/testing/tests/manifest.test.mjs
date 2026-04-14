import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTempLitoProject } from "../dist/index.js";
import { generateRouteManifests } from "../../cli/dist/generate-route-manifests.js";

test("generateRouteManifests writes page and api manifests for folder-based routes", () => {
  const project = createTempLitoProject({
    "app/pages/_index.ts": "export default {}\n",
    "app/pages/docs/_layout.ts": "export default {}\n",
    "app/pages/docs/getting-started/_index.ts": "export default {}\n",
    "app/pages/_not-found.ts": "export default {}\n",
    "app/pages/_error.ts": "export default {}\n",
    "app/api/_middleware.ts": "export default async function middleware(_context, next) { await next(); }\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    generateRouteManifests(project.rootDir);

    const pageManifest = readFileSync(resolve(project.rootDir, "src/generated/page-manifest.ts"), "utf8");
    const apiManifest = readFileSync(resolve(project.rootDir, "src/generated/api-manifest.ts"), "utf8");

    assert.match(pageManifest, /"\.\.\/\.\.\/app\/pages\/_index\.ts"/);
    assert.match(pageManifest, /docs\/getting-started\/_index\.ts/);
    assert.doesNotMatch(pageManifest, /_not-found\.ts/);
    assert.doesNotMatch(pageManifest, /_error\.ts/);
    assert.match(apiManifest, /health\.ts/);
    assert.doesNotMatch(apiManifest, /_middleware\.ts/);
  } finally {
    project.cleanup();
  }
});

test("generateRouteManifests throws when legacy page filenames are present", () => {
  const project = createTempLitoProject({
    "app/pages/dashboard.ts": "export default {}\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    assert.throws(
      () => generateRouteManifests(project.rootDir),
      /app\/pages\/dashboard\.ts -> move to app\/pages\/dashboard\/_index\.ts/
    );
  } finally {
    project.cleanup();
  }
});
