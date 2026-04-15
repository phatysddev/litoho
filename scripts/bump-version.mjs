import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const releaseType = args[0] && !args[0].startsWith("-") ? args[0] : "patch";

const packageJsonFiles = [
  "package.json",
  "packages/app/package.json",
  "packages/cli/package.json",
  "packages/core/package.json",
  "packages/router/package.json",
  "packages/server/package.json",
  "packages/testing/package.json",
  "playgrounds/demo-middleware/package.json",
  "examples/basic-routing/package.json",
  "examples/browser-app/package.json",
  "examples/crud-resource/package.json",
  "examples/fullstack-crud/package.json",
  "examples/middleware-lab/package.json",
  "examples/state-patterns/package.json"
];

const textFiles = [
  "packages/cli/src/scaffold.ts",
  "README.md",
  "packages/cli/README.md"
];

const rootPackagePath = resolve(rootDir, "package.json");
const rootPackage = JSON.parse(readFileSync(rootPackagePath, "utf8"));
const currentVersion = rootPackage.version;
const nextVersion = resolveNextVersion(currentVersion, releaseType);
const today = new Date().toISOString().slice(0, 10);

if (currentVersion === nextVersion) {
  console.log(`Version is already ${nextVersion}`);
  process.exit(0);
}

for (const relativePath of packageJsonFiles) {
  const fullPath = resolve(rootDir, relativePath);
  const json = JSON.parse(readFileSync(fullPath, "utf8"));

  if ("version" in json && json.version === currentVersion) {
    json.version = nextVersion;
  }

  rewriteDependencyMap(json.dependencies, currentVersion, nextVersion);
  rewriteDependencyMap(json.devDependencies, currentVersion, nextVersion);
  rewriteDependencyMap(json.peerDependencies, currentVersion, nextVersion);

  writeFileSync(fullPath, JSON.stringify(json, null, 2) + "\n");
}

for (const relativePath of textFiles) {
  const fullPath = resolve(rootDir, relativePath);
  const source = readFileSync(fullPath, "utf8");
  const next = source
    .replaceAll(`^${currentVersion}`, `^${nextVersion}`)
    .replaceAll(`\`${currentVersion}\``, `\`${nextVersion}\``)
    .replaceAll(` ${currentVersion} `, ` ${nextVersion} `);

  writeFileSync(fullPath, next);
}

updateChangelog(currentVersion, nextVersion, today);

console.log(`Bumped version: ${currentVersion} -> ${nextVersion}`);

function rewriteDependencyMap(dependencies, fromVersion, toVersion) {
  if (!dependencies || typeof dependencies !== "object") {
    return;
  }

  for (const [name, value] of Object.entries(dependencies)) {
    if (typeof value !== "string") {
      continue;
    }

    if (
      name === "@litoho/app" ||
      name === "@litoho/core" ||
      name === "@litoho/router" ||
      name === "@litoho/server" ||
      name === "litoho"
    ) {
      dependencies[name] = value.replaceAll(`^${fromVersion}`, `^${toVersion}`);
    }
  }
}

function resolveNextVersion(current, target) {
  if (/^\d+\.\d+\.\d+$/.test(target)) {
    return target;
  }

  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(current);

  if (!match) {
    throw new Error(`Unsupported current version: ${current}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (target) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Unsupported bump target: ${target}`);
  }
}

function updateChangelog(currentVersion, nextVersion, date) {
  const changelogPath = resolve(rootDir, "CHANGELOG.md");
  const releaseHeading = `## ${nextVersion} - ${date}`;
  const previousHeading = `## ${currentVersion}`;

  if (!existsSync(changelogPath)) {
    writeFileSync(
      changelogPath,
      `# Changelog

All notable changes to this project will be documented in this file.

## ${nextVersion} - ${date}

- Release ${nextVersion}
- Version bump from ${currentVersion}
`
    );
    return;
  }

  const source = readFileSync(changelogPath, "utf8");

  if (source.includes(releaseHeading)) {
    return;
  }

  const insertAt = source.startsWith("# Changelog") ? source.indexOf("\n\n") + 2 : 0;
  const releaseSection = `${releaseHeading}

- Release ${nextVersion}
- Version bump from ${currentVersion}

`;

  const next = insertAt > 1
    ? `${source.slice(0, insertAt)}${releaseSection}${source.slice(insertAt)}`
    : `# Changelog

${releaseSection}${source}`;

  writeFileSync(
    changelogPath,
    next.replace(previousHeading, previousHeading)
  );
}
