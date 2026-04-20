import { spawnSync } from "node:child_process";
import { resolveReportPath, updateReleaseStep } from "./release-report.mjs";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const skipTest = args.includes("--skip-test");
const published = args.includes("--published");
const forwardedSmokeArgs = args.filter((arg) => arg !== "--skip-test");
const reportPath = resolveReportPath(rootDir, readFlagValue(args, "--report"));
const verifyReport = {
  published,
  skipTest,
  steps: []
};

try {
  console.log("[Litoho verify] running release preflight");
  run("node", ["scripts/release-preflight.mjs", "--report", reportPath], rootDir, "preflight");

  console.log("\n[Litoho verify] running scaffold smoke test");
  run("node", ["scripts/smoke-new-app.mjs", ...forwardedSmokeArgs, "--report", reportPath], rootDir, "smoke");

  if (!skipTest) {
    console.log("\n[Litoho verify] running test suite");
    run("pnpm", ["test"], rootDir, "test");
  } else {
    console.log("\n[Litoho verify] skipping test suite");
    verifyReport.steps.push({
      name: "test",
      status: "skipped"
    });
  }

  updateReleaseStep(reportPath, "verify", {
    status: "passed",
    ...verifyReport
  });
} catch (error) {
  updateReleaseStep(reportPath, "verify", {
    status: "failed",
    ...verifyReport,
    error: error instanceof Error ? error.message : String(error)
  });
  throw error;
}

console.log(
  `\n[Litoho verify] release verification passed${published ? " for published smoke mode" : ""}`
);

function run(command, commandArgs, cwd, stepName) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    env: process.env
  });

  verifyReport.steps.push({
    name: stepName,
    status: result.status === 0 ? "passed" : "failed",
    command,
    args: commandArgs
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

function readFlagValue(inputArgs, flagName) {
  const index = inputArgs.indexOf(flagName);
  return index >= 0 ? inputArgs[index + 1] : undefined;
}
