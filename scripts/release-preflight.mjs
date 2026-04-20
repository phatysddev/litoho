import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveReportPath, updateReleaseStep } from "./release-report.mjs";

const rootDir = process.cwd();
const scope = process.env.LITOHO_SCOPE?.trim() || "@litoho";
const cliPackageName = process.env.LITOHO_CLI_PACKAGE?.trim() || "litoho";
const cliBin = process.env.LITOHO_CLI_BIN?.trim() || "litoho";
const reportPath = resolveReportPath(rootDir, readFlagValue(process.argv.slice(2), "--report"));

const packages = [
  {
    dir: "packages/router",
    expectedName: `${scope}/router`,
    distFiles: ["dist/index.js", "dist/index.d.ts"]
  },
  {
    dir: "packages/core",
    expectedName: `${scope}/core`,
    distFiles: ["dist/index.js", "dist/index.d.ts"]
  },
  {
    dir: "packages/ui",
    expectedName: `${scope}/ui`,
    distFiles: ["dist/index.js", "dist/index.d.ts"]
  },
  {
    dir: "packages/server",
    expectedName: `${scope}/server`,
    distFiles: ["dist/index.js", "dist/index.d.ts"]
  },
  {
    dir: "packages/app",
    expectedName: `${scope}/app`,
    distFiles: ["dist/index.js", "dist/index.d.ts"]
  },
  {
    dir: "packages/cli",
    expectedName: cliPackageName,
    distFiles: ["dist/index.js", "dist/index.d.ts"],
    expectedBin: cliBin
  }
];

let hasErrors = false;
let hasWarnings = false;
const report = {
  scope,
  cliPackageName,
  cliBin,
  packages: [],
  checks: {}
};

console.log("Litoho publish preflight\n");
console.log(`- scope: ${scope}`);
console.log(`- cli package: ${cliPackageName}`);
console.log(`- cli bin: ${cliBin}`);
console.log("");

if (cliPackageName === "litoho") {
  console.log("[note] Unscoped CLI publishing depends on npm allowing the package name.");
  console.log("[note] If npm rejects it, use a scoped CLI package such as @your-scope/litoho.\n");
}

for (const pkg of packages) {
  const packageJsonPath = resolve(rootDir, pkg.dir, "package.json");

  if (!existsSync(packageJsonPath)) {
    hasErrors = true;
    console.log(`[error] Missing ${pkg.dir}/package.json`);
    continue;
  }

  const json = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const packageEntry = {
    dir: pkg.dir,
    currentName: json.name,
    publishName: pkg.expectedName,
    version: json.version,
    distFiles: {},
    binOk: "expectedBin" in pkg ? false : undefined
  };
  console.log(`${pkg.dir}`);
  console.log(`- current name: ${json.name}`);
  console.log(`- publish name: ${pkg.expectedName}`);
  console.log(`- version: ${json.version}`);

  if (!json.version) {
    hasErrors = true;
    console.log("- status: error, missing version");
  }

  for (const relativeFile of pkg.distFiles) {
    const fullPath = resolve(rootDir, pkg.dir, relativeFile);
    const ok = existsSync(fullPath);
    packageEntry.distFiles[relativeFile] = ok;
    console.log(`- ${relativeFile}: ${ok ? "ok" : "missing"}`);
    if (!ok) {
      hasErrors = true;
    }
  }

  if ("expectedBin" in pkg) {
    const bin = json.bin ?? {};
    const hasBin = typeof bin === "object" && pkg.expectedBin in bin;
    packageEntry.binOk = hasBin;
    console.log(`- bin ${pkg.expectedBin}: ${hasBin ? "ok" : "missing"}`);
    if (!hasBin) {
      hasErrors = true;
    }
  }

  console.log("");
  report.packages.push(packageEntry);
}

validateCliScaffoldVersion();
validatePublicAssetSupport();
validateMvpGate();
validateSmokeScript();

console.log("Suggested commands:");
console.log(`- pnpm run identity:preview`);
console.log(`- pnpm run release:verify`);
console.log(`- pnpm run release:smoke:new`);
console.log(`- LITOHO_SCOPE=${scope} LITOHO_CLI_PACKAGE=${cliPackageName} LITOHO_CLI_BIN=${cliBin} pnpm run release:pack`);
console.log(`- LITOHO_SCOPE=${scope} LITOHO_CLI_PACKAGE=${cliPackageName} LITOHO_CLI_BIN=${cliBin} pnpm run release:publish`);

if (hasErrors) {
  finalizeReport("failed");
  console.log("\nPreflight result: FAILED");
  process.exit(1);
}

if (hasWarnings) {
  finalizeReport("warning");
  console.log("\nPreflight result: OK with warnings");
  process.exit(0);
}

finalizeReport("passed");
console.log("\nPreflight result: OK");

function validateCliScaffoldVersion() {
  const cliPackageJsonPath = resolve(rootDir, "packages/cli/package.json");
  const cliSourceScaffoldPath = resolve(rootDir, "packages/cli/src/scaffold.ts");
  const cliDistScaffoldPath = resolve(rootDir, "packages/cli/dist/scaffold.js");

  if (!existsSync(cliPackageJsonPath) || !existsSync(cliSourceScaffoldPath) || !existsSync(cliDistScaffoldPath)) {
    hasErrors = true;
    console.log("[error] CLI scaffold version check could not run because one or more files are missing.");
    return;
  }

  const cliPackageVersion = JSON.parse(readFileSync(cliPackageJsonPath, "utf8")).version;
  const sourceVersion = readScaffoldVersion(cliSourceScaffoldPath);
  const distVersion = readScaffoldVersion(cliDistScaffoldPath);

  console.log("packages/cli scaffold version sync");
  console.log(`- package version: ${cliPackageVersion}`);
  console.log(`- src scaffold dependency version: ${sourceVersion ?? "missing"}`);
  console.log(`- dist scaffold dependency version: ${distVersion ?? "missing"}`);

  const expected = `^${cliPackageVersion}`;
  report.checks.cliScaffoldVersion = {
    packageVersion: cliPackageVersion,
    sourceVersion,
    distVersion,
    expected
  };
  if (sourceVersion !== expected || distVersion !== expected) {
    hasErrors = true;
    console.log(`- status: error, expected both scaffold versions to be ${expected}`);
  } else {
    console.log("- status: ok");
  }

  console.log("");
}

function readScaffoldVersion(filePath) {
  const source = readFileSync(filePath, "utf8");
  const match = source.match(/LITOHO_VERSION\s*=\s*["'`]([^"'`]+)["'`]/);
  return match?.[1] ?? null;
}

function validatePublicAssetSupport() {
  const serverSourcePath = resolve(rootDir, "packages/server/src/server.ts");
  const nodeAppSourcePath = resolve(rootDir, "packages/server/src/node-app.ts");
  const scaffoldSourcePath = resolve(rootDir, "packages/cli/src/scaffold.ts");
  const scaffoldDistPath = resolve(rootDir, "packages/cli/dist/scaffold.js");

  console.log("public asset support");

  const serverSource = existsSync(serverSourcePath) ? readFileSync(serverSourcePath, "utf8") : "";
  const nodeAppSource = existsSync(nodeAppSourcePath) ? readFileSync(nodeAppSourcePath, "utf8") : "";
  const scaffoldSource = existsSync(scaffoldSourcePath) ? readFileSync(scaffoldSourcePath, "utf8") : "";
  const scaffoldDist = existsSync(scaffoldDistPath) ? readFileSync(scaffoldDistPath, "utf8") : "";

  const checks = [
    {
      label: "server publicRoot option",
      ok: serverSource.includes("publicRoot?: string")
    },
    {
      label: "server static asset matcher",
      ok: serverSource.includes("shouldServeStaticAsset")
    },
    {
      label: "node app publicRoot wiring",
      ok: nodeAppSource.includes("publicRoot: existsSync(publicRoot) ? publicRoot : undefined")
    },
    {
      label: "new app public directory",
      ok: scaffoldSource.includes('resolve(rootDir, "public"')
    },
    {
      label: "new app public robots.txt",
      ok: scaffoldSource.includes('public/robots.txt')
    },
    {
      label: "dist scaffold public robots.txt",
      ok: scaffoldDist.includes('public/robots.txt')
    }
  ];

  for (const check of checks) {
    console.log(`- ${check.label}: ${check.ok ? "ok" : "missing"}`);
    if (!check.ok) {
      hasErrors = true;
    }
  }

  report.checks.publicAssetSupport = checks;

  console.log("");
}

function validateMvpGate() {
  console.log("mvp gate docs");

  const checks = [
    {
      label: "docs/MVP.md",
      ok: existsSync(resolve(rootDir, "docs/MVP.md"))
    },
    {
      label: "README mentions public assets",
      ok: readTextIfExists(resolve(rootDir, "README.md")).includes("public/")
    },
    {
      label: "PUBLISHING mentions MVP gate",
      ok: readTextIfExists(resolve(rootDir, "docs/PUBLISHING.md")).includes("docs/MVP.md")
    }
  ];

  for (const check of checks) {
    console.log(`- ${check.label}: ${check.ok ? "ok" : "missing"}`);
    if (!check.ok) {
      hasWarnings = true;
    }
  }

  report.checks.mvpGateDocs = checks;

  console.log("");
}

function validateSmokeScript() {
  console.log("release smoke test");

  const rootPackageJsonPath = resolve(rootDir, "package.json");
  const smokeScriptPath = resolve(rootDir, "scripts/smoke-new-app.mjs");
  const packageJson = existsSync(rootPackageJsonPath) ? JSON.parse(readFileSync(rootPackageJsonPath, "utf8")) : {};
  const scripts = packageJson.scripts ?? {};

  const checks = [
    {
      label: "scripts/smoke-new-app.mjs",
      ok: existsSync(smokeScriptPath)
    },
    {
      label: "package.json release:smoke:new",
      ok: scripts["release:smoke:new"] === "node scripts/smoke-new-app.mjs"
    }
  ];

  for (const check of checks) {
    console.log(`- ${check.label}: ${check.ok ? "ok" : "missing"}`);
    if (!check.ok) {
      hasWarnings = true;
    }
  }

  report.checks.smokeScript = checks;

  console.log("");
}

function readTextIfExists(filePath) {
  return existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
}

function readFlagValue(args, flagName) {
  const index = args.indexOf(flagName);
  return index >= 0 ? args[index + 1] : undefined;
}

function finalizeReport(status) {
  updateReleaseStep(reportPath, "preflight", {
    status,
    hasErrors,
    hasWarnings,
    ...report
  });
}
