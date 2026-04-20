import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function resolveReportPath(rootDir, explicitPath) {
  return resolve(rootDir, explicitPath ?? process.env.LITOHO_RELEASE_REPORT ?? "release-report.json");
}

export function readReleaseReport(reportPath) {
  if (!existsSync(reportPath)) {
    return {
      generatedAt: null,
      status: "warning",
      steps: {}
    };
  }

  return JSON.parse(readFileSync(reportPath, "utf8"));
}

export function writeReleaseReport(reportPath, updater) {
  const current = readReleaseReport(reportPath);
  const next = updater(current);
  const status = summarizeReleaseStatus(next.steps ?? {});

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        ...next,
        status,
        generatedAt: new Date().toISOString()
      },
      null,
      2
    ) + "\n"
  );
}

export function updateReleaseStep(reportPath, stepName, payload) {
  writeReleaseReport(reportPath, (current) => ({
    ...current,
    steps: {
      ...(current.steps ?? {}),
      [stepName]: {
        ...(current.steps?.[stepName] ?? {}),
        ...payload,
        updatedAt: new Date().toISOString()
      }
    }
  }));
}

export function summarizeReleaseStatus(steps) {
  const stepStatuses = Object.values(steps ?? {}).map((step) => step?.status).filter(Boolean);

  if (stepStatuses.length === 0) {
    return "warning";
  }

  if (stepStatuses.includes("failed")) {
    return "failed";
  }

  if (stepStatuses.includes("warning")) {
    return "warning";
  }

  if (stepStatuses.every((status) => status === "passed" || status === "skipped")) {
    return "passed";
  }

  return "warning";
}
