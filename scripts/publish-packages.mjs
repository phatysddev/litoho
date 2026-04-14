import { cpSync, mkdtempSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { applyPackageIdentity } from "./package-identity.mjs";

const rootDir = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const npmCache = "/tmp/lito-npm-cache";
const scope = process.env.LITO_SCOPE?.trim() || "@lito";
const cliPackageName = process.env.LITO_CLI_PACKAGE?.trim() || "lito";
const cliBin = process.env.LITO_CLI_BIN?.trim() || "lito";
const cliAccess = cliPackageName.startsWith("@") ? "public" : undefined;
const releaseRoot = createReleaseWorkspace();

const packages = [
  { dir: "packages/router", label: `${scope}/router`, access: "public" },
  { dir: "packages/core", label: `${scope}/core`, access: "public" },
  { dir: "packages/server", label: `${scope}/server`, access: "public" },
  { dir: "packages/app", label: `${scope}/app`, access: "public" },
  { dir: "packages/cli", label: cliPackageName, access: cliAccess }
];

exec("pnpm", ["build"], releaseRoot);
applyPackageIdentity({
  rootDir: releaseRoot,
  scope,
  cliPackage: cliPackageName,
  cliBin,
  write: true,
  includeDist: true
});

for (const pkg of packages) {
  const packageDir = resolve(releaseRoot, pkg.dir);
  const args = ["publish", "--cache", npmCache];

  if (pkg.access) {
    args.push("--access", pkg.access);
  }

  if (dryRun) {
    args.push("--dry-run");
  }

  console.log(`\nPublishing ${pkg.label} from ${pkg.dir}${dryRun ? " (dry run)" : ""}`);

  try {
    exec("npm", args, packageDir);
  } catch (error) {
    printPublishHelp(pkg.label);
    throw error;
  }
}

function exec(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}

function createReleaseWorkspace() {
  const tempRoot = mkdtempSync(join(tmpdir(), "lito-release-"));

  cpSync(resolve(rootDir, "packages"), resolve(tempRoot, "packages"), {
    recursive: true,
    filter: (source) => !source.includes("/dist/") && !source.endsWith(".tsbuildinfo")
  });
  cpSync(resolve(rootDir, "scripts"), resolve(tempRoot, "scripts"), {
    recursive: true,
    filter: (source) => !source.endsWith("publish-packages.mjs")
  });
  cpSync(resolve(rootDir, "package.json"), resolve(tempRoot, "package.json"));
  cpSync(resolve(rootDir, "tsconfig.base.json"), resolve(tempRoot, "tsconfig.base.json"));
  symlinkSync(resolve(rootDir, "node_modules"), resolve(tempRoot, "node_modules"), "dir");

  return tempRoot;
}

function printPublishHelp(packageName) {
  console.error(`
[Lito publish error]
Failed while publishing ${packageName}.

Common cause:
- you do not own the npm scope used by this repo

Current publish settings:
- LITO_SCOPE=${scope}
- LITO_CLI_PACKAGE=${cliPackageName}
- LITO_CLI_BIN=${cliBin}

Examples:
- LITO_SCOPE=@your-npm-scope pnpm run release:publish
- LITO_SCOPE=@your-npm-scope LITO_CLI_PACKAGE=@your-npm-scope/lito pnpm run release:publish
- LITO_SCOPE=@your-npm-scope LITO_CLI_PACKAGE=@your-npm-scope/lito LITO_CLI_BIN=lito pnpm run release:publish

Important:
- \`npx lito new demo-app\` only works if you can publish the unscoped package name \`lito\`
- if \`lito\` is unavailable, use a scoped CLI package and run:
  npx ${cliPackageName} new demo-app
`);
}
