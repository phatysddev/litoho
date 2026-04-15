import { cpSync, existsSync, mkdtempSync, symlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { applyPackageIdentity } from "./package-identity.mjs";

const rootDir = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const bumpTarget = readFlagValue(process.argv.slice(2), "--bump") ?? process.env.LITOHO_BUMP?.trim() ?? "patch";
const autoBump = !dryRun && process.env.LITOHO_AUTO_BUMP !== "false";
const allowDirty = process.env.LITOHO_ALLOW_DIRTY === "true";
const autoGit = !dryRun && process.env.LITOHO_AUTO_GIT !== "false";
const npmCache = "/tmp/litoho-npm-cache";
const scope = process.env.LITOHO_SCOPE?.trim() || "@litoho";
const cliPackageName = process.env.LITOHO_CLI_PACKAGE?.trim() || "litoho";
const cliBin = process.env.LITOHO_CLI_BIN?.trim() || "litoho";
const cliAccess = cliPackageName.startsWith("@") ? "public" : undefined;

ensureCleanWorktree();

if (autoBump) {
  console.log(`[Litoho publish] Auto bumping version with "${bumpTarget}"`);
  exec("node", ["scripts/bump-version.mjs", bumpTarget], rootDir);
}

const releaseVersion = readRootVersion();

const hasBuildToolchain = canBuildFromSource();
const releaseRoot = createReleaseWorkspace({ includeDist: !hasBuildToolchain });

const packages = [
  { dir: "packages/router", label: `${scope}/router`, access: "public" },
  { dir: "packages/core", label: `${scope}/core`, access: "public" },
  { dir: "packages/ui", label: `${scope}/ui`, access: "public" },
  { dir: "packages/server", label: `${scope}/server`, access: "public" },
  { dir: "packages/app", label: `${scope}/app`, access: "public" },
  { dir: "packages/cli", label: cliPackageName, access: cliAccess }
];

if (hasBuildToolchain) {
  exec("pnpm", ["build"], releaseRoot);
} else {
  console.warn(`
[Litoho publish warning]
TypeScript build toolchain was not found locally (${resolve(rootDir, "node_modules/.bin/tsc")}).
The release workspace will reuse the existing checked-in dist files instead of rebuilding from source.

If you want a fresh build before publishing:
- run pnpm install
- run pnpm build
`);
}

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

if (autoGit) {
  createReleaseCommitAndTag(releaseVersion);
}

function exec(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}

function createReleaseWorkspace(options = { includeDist: false }) {
  const tempRoot = mkdtempSync(join(tmpdir(), "litoho-release-"));

  cpSync(resolve(rootDir, "packages"), resolve(tempRoot, "packages"), {
    recursive: true,
    filter: (source) => {
      if (!options.includeDist && source.includes("/dist/")) {
        return false;
      }

      return !source.endsWith(".tsbuildinfo");
    }
  });
  cpSync(resolve(rootDir, "scripts"), resolve(tempRoot, "scripts"), {
    recursive: true,
    filter: (source) => !source.endsWith("publish-packages.mjs")
  });
  cpSync(resolve(rootDir, "package.json"), resolve(tempRoot, "package.json"));
  if (existsSync(resolve(rootDir, "pnpm-workspace.yaml"))) {
    cpSync(resolve(rootDir, "pnpm-workspace.yaml"), resolve(tempRoot, "pnpm-workspace.yaml"));
  }
  cpSync(resolve(rootDir, "tsconfig.base.json"), resolve(tempRoot, "tsconfig.base.json"));
  if (existsSync(resolve(rootDir, "node_modules"))) {
    symlinkSync(resolve(rootDir, "node_modules"), resolve(tempRoot, "node_modules"), "dir");
  }

  return tempRoot;
}

function canBuildFromSource() {
  return existsSync(resolve(rootDir, "node_modules/.bin/tsc"));
}

function readFlagValue(args, flagName) {
  const index = args.indexOf(flagName);
  return index >= 0 ? args[index + 1] : undefined;
}

function ensureCleanWorktree() {
  if (dryRun) {
    return;
  }

  if (allowDirty) {
    return;
  }

  const output = execCapture("git", ["status", "--short"], rootDir).trim();

  if (output.length === 0) {
    return;
  }

  console.error(`
[Litoho publish guard]
The git worktree is not clean.

Commit or stash your changes before publishing so the auto bump, changelog, and git tag only contain release changes.

If you really want to continue with a dirty worktree:
  LITOHO_ALLOW_DIRTY=true pnpm run release:publish
`);
  process.exit(1);
}

function readRootVersion() {
  return JSON.parse(execCapture("node", ["-e", "process.stdout.write(require('node:fs').readFileSync('package.json','utf8'))"], rootDir)).version;
}

function createReleaseCommitAndTag(version) {
  const tag = `v${version}`;

  try {
    exec("git", ["add", "-A"], rootDir);
    exec("git", ["commit", "-m", `release: ${tag}`], rootDir);
  } catch (error) {
    console.warn(`
[Litoho publish warning]
Publish succeeded, but git commit failed.
You can still commit manually and create the tag ${tag}.
`);
    return;
  }

  try {
    exec("git", ["tag", "-a", tag, "-m", `release: ${tag}`], rootDir);
  } catch (error) {
    console.warn(`
[Litoho publish warning]
Release commit was created, but git tag ${tag} could not be created automatically.
`);
    return;
  }

  console.log(`
[Litoho publish]
Created release commit and tag:
- commit message: release: ${tag}
- tag: ${tag}
`);
}

function execCapture(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8"
  });
}

function printPublishHelp(packageName) {
  console.error(`
[Litoho publish error]
Failed while publishing ${packageName}.

Common cause:
- you do not own the npm scope used by this repo

Current publish settings:
- LITOHO_SCOPE=${scope}
- LITOHO_CLI_PACKAGE=${cliPackageName}
- LITOHO_CLI_BIN=${cliBin}

Examples:
- LITOHO_SCOPE=@your-npm-scope pnpm run release:publish
- LITOHO_SCOPE=@your-npm-scope LITOHO_CLI_PACKAGE=@your-npm-scope/litoho pnpm run release:publish
- LITOHO_SCOPE=@your-npm-scope LITOHO_CLI_PACKAGE=@your-npm-scope/litoho LITOHO_CLI_BIN=litoho pnpm run release:publish

Important:
- \`npx litoho new demo-app\` only works if you can publish the unscoped package name \`litoho\`
- if \`litoho\` is unavailable, use a scoped CLI package and run:
  npx ${cliPackageName} new demo-app
`);
}
