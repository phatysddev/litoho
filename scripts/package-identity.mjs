import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const args = process.argv.slice(2);
const rootArg = readArgValue(args, "--root") ?? ".";
const rootDir = resolve(process.cwd(), rootArg);
const scope = process.env.LITO_SCOPE?.trim() || "@lito";
const cliPackage = process.env.LITO_CLI_PACKAGE?.trim() || "lito";
const cliBin = process.env.LITO_CLI_BIN?.trim() || "lito";
const applyMode = args.includes("--apply");
const previewMode = args.includes("--preview") || !applyMode;

const textExtensions = new Set([".ts", ".js", ".mjs", ".md", ".json", ".yaml", ".yml", ".html"]);
const packageJsonFiles = new Set([
  "package.json",
  "packages/app/package.json",
  "packages/core/package.json",
  "packages/router/package.json",
  "packages/server/package.json",
  "packages/cli/package.json",
  "packages/testing/package.json",
  "playgrounds/demo-app/package.json",
  "playgrounds/demo-hydration/package.json",
  "playgrounds/demo-state/package.json"
]);

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("/package-identity.mjs")) {
  const changes = applyPackageIdentity({ rootDir, scope, cliPackage, cliBin, write: applyMode });

  if (previewMode) {
    printSummary(changes, applyMode ? "Applied" : "Preview");
  } else {
    printSummary(changes, "Applied");
  }
}

export function applyPackageIdentity(options) {
  const changes = [];

  for (const filePath of walkFiles(options.rootDir, options)) {
    const relativePath = filePath.slice(options.rootDir.length + 1).replace(/\\/g, "/");
    const extension = extname(filePath);

    if (!textExtensions.has(extension) && !packageJsonFiles.has(relativePath)) {
      continue;
    }

    const original = readFileSync(filePath, "utf8");
    const next = packageJsonFiles.has(relativePath)
      ? rewritePackageJson(original, relativePath, options)
      : rewriteText(original, options);

    if (next === original) {
      continue;
    }

    if (options.write) {
      writeFileSync(filePath, next);
    }

    changes.push(relativePath);
  }

  return changes;
}

function rewritePackageJson(source, relativePath, options) {
  const json = JSON.parse(source);

  if (relativePath === "packages/core/package.json") {
    json.name = options.scope + "/core";
  }

  if (relativePath === "packages/router/package.json") {
    json.name = options.scope + "/router";
  }

  if (relativePath === "packages/server/package.json") {
    json.name = options.scope + "/server";
  }

  if (relativePath === "packages/app/package.json") {
    json.name = options.scope + "/app";
  }

  if (relativePath === "packages/cli/package.json") {
    json.name = options.cliPackage;

    if (json.bin && typeof json.bin === "object") {
      const cliEntry = json.bin.lito ?? Object.values(json.bin)[0];
      json.bin = {
        [options.cliBin]: cliEntry
      };
    }
  }

  rewriteDependencyMap(json.dependencies, options);
  rewriteDependencyMap(json.devDependencies, options);
  rewriteDependencyMap(json.peerDependencies, options);
  rewriteScriptMap(json.scripts, options);

  return JSON.stringify(json, null, 2) + "\n";
}

function rewriteDependencyMap(dependencies, options) {
  if (!dependencies || typeof dependencies !== "object") {
    return;
  }

  renameDependency(dependencies, "@lito/app", `${options.scope}/app`);
  renameDependency(dependencies, "@lito/core", `${options.scope}/core`);
  renameDependency(dependencies, "@lito/router", `${options.scope}/router`);
  renameDependency(dependencies, "@lito/server", `${options.scope}/server`);
  renameDependency(dependencies, "lito", options.cliPackage);
}

function renameDependency(dependencies, from, to) {
  if (!(from in dependencies) || from === to) {
    return;
  }

  dependencies[to] = dependencies[from];
  delete dependencies[from];
}

function rewriteScriptMap(scripts, options) {
  if (!scripts || typeof scripts !== "object") {
    return;
  }

  for (const [key, value] of Object.entries(scripts)) {
    if (typeof value !== "string") {
      continue;
    }

    scripts[key] = value
      .replaceAll("pnpm exec lito ", `pnpm exec ${options.cliBin} `)
      .replaceAll("npx lito ", `npx ${options.cliPackage} `);
  }
}

function rewriteText(source, options) {
  return source
    .replaceAll("@lito/app", `${options.scope}/app`)
    .replaceAll("@lito/core", `${options.scope}/core`)
    .replaceAll("@lito/router", `${options.scope}/router`)
    .replaceAll("@lito/server", `${options.scope}/server`)
    .replaceAll('process.env.LITO_SCOPE?.trim() || "@lito"', `process.env.LITO_SCOPE?.trim() || "${options.scope}"`)
    .replaceAll('process.env.LITO_CLI_PACKAGE?.trim() || "lito"', `process.env.LITO_CLI_PACKAGE?.trim() || "${options.cliPackage}"`)
    .replaceAll('process.env.LITO_CLI_BIN?.trim() || "lito"', `process.env.LITO_CLI_BIN?.trim() || "${options.cliBin}"`)
    .replaceAll("pnpm exec lito ", `pnpm exec ${options.cliBin} `)
    .replaceAll("npx lito ", `npx ${options.cliPackage} `);
}

function walkFiles(directory, options) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (shouldSkipEntry(entry.name, options)) {
      continue;
    }

    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, options));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldSkipEntry(name, options) {
  return (
    name === ".git" ||
    name === "node_modules" ||
    (name === "dist" && !options.includeDist) ||
    name === ".turbo" ||
    name === ".vite" ||
    name.endsWith(".tgz") ||
    name === "pnpm-lock.yaml" ||
    name === "repomix-output.md" ||
    name.endsWith(".tsbuildinfo")
  );
}

function readArgValue(args, flagName) {
  const index = args.indexOf(flagName);
  return index >= 0 ? args[index + 1] : undefined;
}

function printSummary(changes, label) {
  console.log(`${label} ${changes.length} file(s) for package identity.`);

  for (const file of changes) {
    console.log(`- ${file}`);
  }
}
