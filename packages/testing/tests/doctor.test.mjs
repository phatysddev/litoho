import test from "node:test";
import assert from "node:assert/strict";
import { createTempLitoProject } from "../dist/index.js";
import { formatDoctorReport, hasDoctorErrors, runLitoDoctor } from "../../cli/dist/doctor.js";

test("runLitoDoctor reports legacy page filenames and missing conventions", () => {
  const project = createTempLitoProject({
    "app/pages/index.ts": "export default {}\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    const findings = runLitoDoctor(project.rootDir);
    const report = formatDoctorReport(findings);

    assert.equal(hasDoctorErrors(findings), true);
    assert.match(report, /app\/pages\/index\.ts should be moved to app\/pages\/_index\.ts/);
    assert.match(report, /Missing `app\/pages\/_not-found\.ts`/);
    assert.match(report, /Missing `app\/pages\/_error\.ts`/);
    assert.match(report, /No `app\/api\/_middleware\.ts` found/);
  } finally {
    project.cleanup();
  }
});
