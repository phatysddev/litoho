import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveReportPath, updateReleaseStep } from "./release-report.mjs";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const scope = readFlagValue(args, "--scope") ?? process.env.LITOHO_SCOPE?.trim() ?? "@litoho";
const cliPackageName = readFlagValue(args, "--cli-package") ?? process.env.LITOHO_CLI_PACKAGE?.trim() ?? "litoho";
const published = args.includes("--published");
const shouldInstall = args.includes("--install");
const shouldBuild = args.includes("--build") || args.includes("--start");
const shouldStart = args.includes("--start");
const packageManager = readFlagValue(args, "--package-manager") ?? "npm";
const port = Number(readFlagValue(args, "--port") ?? "4310");
const reportPath = resolveReportPath(rootDir, readFlagValue(args, "--report"));
const tempRoot = mkdtempSync(join(tmpdir(), "litoho-smoke-"));
const appName = readFlagValue(args, "--app-name") ?? "demo-app";
const appRoot = resolve(tempRoot, appName);
const smokeReport = {
  mode: published ? "published" : "local",
  scope,
  cliPackageName,
  packageManager,
  appName,
  install: shouldInstall,
  build: shouldBuild,
  start: shouldStart,
  generatedFilesVerified: false,
  versionSyncVerified: false,
  routeManifestVerified: false,
  startProbeVerified: false
};

async function main() {
  console.log(`[Litoho smoke] temp root: ${tempRoot}`);
  console.log(`[Litoho smoke] scope: ${scope}`);
  console.log(`[Litoho smoke] cli package: ${cliPackageName}`);
  scaffoldApp();
  verifyScaffoldedFiles();
  verifyVersionSync();
  generateRoutes();

  if (shouldInstall) {
    run(packageManager, installArgs(packageManager), tempRoot);
  } else {
    console.log("[Litoho smoke] skipping dependency install");
  }

  if (shouldBuild) {
    run(packageManager, runScriptArgs(packageManager, "build"), appRoot);
    smokeReport.buildExecuted = true;
  } else {
    console.log("[Litoho smoke] skipping build");
  }

  if (shouldStart) {
    await startAndProbeApp();
  } else {
    console.log("[Litoho smoke] skipping start probe");
  }

  console.log("[Litoho smoke] scaffold smoke test passed");
  finalizeReport("passed");
}

try {
  await main();
} catch (error) {
  finalizeReport("failed", {
    error: error instanceof Error ? error.message : String(error)
  });
  throw error;
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

function scaffoldApp() {
  if (published) {
    console.log(`[Litoho smoke] scaffolding with published CLI: npx ${cliPackageName} new ${appName}`);
    run("npx", ["-y", cliPackageName, "new", appName], tempRoot);
    return;
  }

  const localCliEntry = resolve(rootDir, "packages/cli/dist/index.js");
  if (!existsSync(localCliEntry)) {
    throw new Error(`Local CLI entry not found: ${localCliEntry}`);
  }

  console.log(`[Litoho smoke] scaffolding with local CLI: node ${localCliEntry} new ${appName}`);
  run("node", [localCliEntry, "new", appName], tempRoot);
}

function verifyScaffoldedFiles() {
  const requiredFiles = [
    "package.json",
    "server.ts",
    "vite.config.ts",
    "src/main.ts",
    "src/styles.css",
    "app/pages/_index.ts",
    "app/pages/_layout.ts",
    "app/api/health.ts",
    "public/robots.txt",
    "public/logo.svg"
  ];

  const missingFiles = requiredFiles.filter((relativePath) => !existsSync(resolve(appRoot, relativePath)));
  if (missingFiles.length > 0) {
    throw new Error(`Generated app is missing required files:\n- ${missingFiles.join("\n- ")}`);
  }

  console.log("[Litoho smoke] scaffolded file set looks complete");
  smokeReport.generatedFilesVerified = true;
}

function verifyVersionSync() {
  const rootPackageJson = JSON.parse(readFileSync(resolve(rootDir, "package.json"), "utf8"));
  const generatedPackageJson = JSON.parse(readFileSync(resolve(appRoot, "package.json"), "utf8"));
  const expectedVersion = `^${rootPackageJson.version}`;

  const dependencyEntries = [
    ["dependencies", `${scope}/app`],
    ["dependencies", `${scope}/core`],
    ["dependencies", `${scope}/server`],
    ["devDependencies", cliPackageName]
  ];

  for (const [section, name] of dependencyEntries) {
    const actual = generatedPackageJson[section]?.[name];
    if (actual !== expectedVersion) {
      throw new Error(`Generated app dependency mismatch for ${name}: expected ${expectedVersion}, got ${actual ?? "missing"}`);
    }
  }

  console.log(`[Litoho smoke] scaffold dependency versions match ${expectedVersion}`);
  smokeReport.versionSyncVerified = true;
  smokeReport.expectedVersion = expectedVersion;
}

function generateRoutes() {
  const localCliEntry = resolve(rootDir, "packages/cli/dist/index.js");
  if (!existsSync(localCliEntry)) {
    console.log("[Litoho smoke] skipping local route generation check because local CLI dist is missing");
    return;
  }

  run("node", [localCliEntry, "generate", "routes", "--root", appRoot], rootDir);

  const requiredGeneratedFiles = ["src/generated/page-manifest.ts", "src/generated/api-manifest.ts"];
  const missingGeneratedFiles = requiredGeneratedFiles.filter((relativePath) => !existsSync(resolve(appRoot, relativePath)));
  if (missingGeneratedFiles.length > 0) {
    throw new Error(`Route generation did not produce expected files:\n- ${missingGeneratedFiles.join("\n- ")}`);
  }

  console.log("[Litoho smoke] route generation produced manifests");
  smokeReport.routeManifestVerified = true;
}

async function startAndProbeApp() {
  console.log(`[Litoho smoke] starting generated app on port ${port}`);
  const child = spawn(packageManager, runScriptArgs(packageManager, "start"), {
    cwd: appRoot,
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: "pipe"
  });

  const output = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  try {
    await waitForHttp(`http://127.0.0.1:${port}/api/health`);

    const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`);
    const healthBody = await healthResponse.json();
    const robotsResponse = await fetch(`http://127.0.0.1:${port}/robots.txt`);
    const robotsBody = await robotsResponse.text();

    if (!healthResponse.ok || healthBody.ok !== true) {
      throw new Error(`Health check failed: ${JSON.stringify(healthBody)}`);
    }

    if (!robotsResponse.ok || !robotsBody.includes("User-agent: *")) {
      throw new Error(`robots.txt check failed: ${robotsResponse.status}`);
    }

    console.log("[Litoho smoke] start probe passed");
    smokeReport.startProbeVerified = true;
  } finally {
    child.kill("SIGTERM");
    await onceExit(child);
    const combinedOutput = output.join("");
    if (combinedOutput.trim().length > 0) {
      console.log("[Litoho smoke] start output:");
      console.log(combinedOutput.trim());
    }
  }
}

async function waitForHttp(url) {
  const deadline = Date.now() + 30_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(500);
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

function installArgs(manager) {
  if (manager === "pnpm") {
    return ["install"];
  }

  if (manager === "yarn") {
    return ["install"];
  }

  return ["install"];
}

function runScriptArgs(manager, scriptName) {
  if (manager === "pnpm") {
    return ["run", scriptName];
  }

  if (manager === "yarn") {
    return [scriptName];
  }

  return ["run", scriptName];
}

function readFlagValue(inputArgs, flagName) {
  const index = inputArgs.indexOf(flagName);
  return index >= 0 ? inputArgs[index + 1] : undefined;
}

function sleep(ms) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, ms);
  });
}

function onceExit(child) {
  return new Promise((resolvePromise) => {
    child.once("exit", () => resolvePromise());
  });
}

function finalizeReport(status, extra = {}) {
  updateReleaseStep(reportPath, "smoke", {
    status,
    ...smokeReport,
    ...extra
  });
}
