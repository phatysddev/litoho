import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const reportPath = resolve(rootDir, readFlagValue(args, "--report") ?? process.env.LITOHO_RELEASE_REPORT ?? "release-report.json");
const allowWarnings = args.includes("--allow-warnings");

if (!existsSync(reportPath)) {
  console.error(`[Litoho report check] report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const status = report.status ?? "warning";
const steps = report.steps ?? {};

console.log(`[Litoho report check] report: ${reportPath}`);
console.log(`[Litoho report check] status: ${status}`);

for (const [stepName, step] of Object.entries(steps)) {
  console.log(`- ${stepName}: ${step?.status ?? "unknown"}`);
}

if (status === "failed") {
  console.error("[Litoho report check] failing because release report status is failed");
  process.exit(1);
}

if (status === "warning" && !allowWarnings) {
  console.error("[Litoho report check] failing because release report status is warning");
  process.exit(1);
}

console.log("[Litoho report check] release report is acceptable");

function readFlagValue(inputArgs, flagName) {
  const index = inputArgs.indexOf(flagName);
  return index >= 0 ? inputArgs[index + 1] : undefined;
}
