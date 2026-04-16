#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync, watch } from "node:fs";
import { resolve } from "node:path";
import { formatDoctorReport, hasDoctorErrors, runLitoDoctor } from "./doctor.js";
import { generateRouteManifests } from "./generate-route-manifests.js";
import { expandUiSelection, UI_COMPONENT_REGISTRY, UI_PRESET_REGISTRY } from "./ui-registry.js";
import {
  addUiComponentsToProject,
  createApiMiddlewareFile,
  createApiFile,
  createCrudResource,
  createErrorPageFile,
  createLayoutFile,
  createMiddlewareStackFile,
  createNewApp,
  createNotFoundPageFile,
  createPageFile,
  diffLocalUiComponents,
  upgradeLocalUiComponents,
  type ApiQueryField,
  type MiddlewareStackTemplate,
  type PageTemplate,
  type MiddlewareTemplate
} from "./scaffold.js";

const rawArgs = process.argv.slice(2);
const rootArg = readFlagValue(rawArgs, "--root") ?? ".";
const projectRoot = resolve(process.cwd(), rootArg);
const args = stripFlag(rawArgs, "--root");
const [command = "help", ...restArgs] = args;

async function main() {
  switch (command) {
    case "help":
    case "--help":
    case "-h":
      printHelp();
      return;
    case "new": {
      const appName = restArgs[0];

      if (!appName) {
        throw new Error("Usage: litoho new <name>");
      }

      const appRoot = resolve(process.cwd(), appName);
      createNewApp(appRoot);
      console.log(`Created new Litoho app at ${appRoot}`);
      return;
    }
    case "-g":
    case "generate":
    case "g":
      await handleGenerateCommand(restArgs);
      return;
    case "ui":
      await handleUiCommand(restArgs);
      return;
    case "add":
    case "a":
      await handleAddCommand(restArgs);
      return;
    case "dev":
      await runDevCommand(projectRoot);
      return;
    case "build":
      generateRouteManifests(projectRoot);
      runLocalCommand(projectRoot, "vite", ["build"]);
      return;
    case "doctor": {
      const findings = runLitoDoctor(projectRoot);
      console.log(formatDoctorReport(findings));
      if (hasDoctorErrors(findings)) {
        process.exit(1);
      }
      return;
    }
    case "start":
      generateRouteManifests(projectRoot);
      runLocalCommand(projectRoot, "tsx", ["server.ts"], {
        NODE_ENV: "production"
      });
      return;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function handleGenerateCommand(commandArgs: string[]) {
  const params = readRepeatedFlagValues(commandArgs, "--params");
  const queryFields = readQueryFlags(commandArgs);
  const templateValue = readFlagValue(commandArgs, "--template");
  const isCsr = commandArgs.includes("--csr");
  const isSsr = commandArgs.includes("--ssr");
  const force = commandArgs.includes("--force");
  let filteredArgs = stripRepeatedFlag(stripRepeatedFlag(commandArgs, "--params"), "--query");
  filteredArgs = stripFlag(filteredArgs, "--template");
  filteredArgs = stripBooleanFlag(filteredArgs, "--csr");
  filteredArgs = stripBooleanFlag(filteredArgs, "--ssr");
  filteredArgs = stripBooleanFlag(filteredArgs, "--force");
  const [rawGenerateTarget, generatePath] = filteredArgs;
  const generateTarget = normalizeGenerateTarget(rawGenerateTarget);

  const mode = isCsr ? "client" : isSsr ? "server" : undefined;

  switch (generateTarget) {
    case "routes":
      generateRouteManifests(projectRoot);
      console.log(`Generated route manifests for ${projectRoot}`);
      return;
    case "page":
      if (!generatePath) {
        throw new Error("Usage: litoho generate page <path> [--params <name[,name2]>] [--ssr] [--csr] [--root <dir>]");
      }
      console.log(
        `Created page at ${createPageFile(projectRoot, buildRoutePath(generatePath, params), {
          mode,
          throwDemo: commandArgs.includes("--throw-demo"),
          template: parsePageTemplate(templateValue)
        })}`
      );
      return;
    case "api":
      if (!generatePath) {
        throw new Error("Usage: litoho generate api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]");
      }
      console.log(
        `Created api route at ${createApiFile(projectRoot, buildRoutePath(generatePath, params), { queryFields })}`
      );
      return;
    case "resource":
      if (!generatePath) {
        throw new Error("Usage: litoho generate resource <name> [--root <dir>]");
      }
      createCrudResource(projectRoot, buildRoutePath(generatePath, params));
      console.log(`Created CRUD resource for ${buildRoutePath(generatePath, params)}`);
      return;
    case "middleware":
      if (generatePath && generatePath !== "api" && !isMiddlewareTemplateCandidate(generatePath)) {
        throw new Error("Usage: litoho generate middleware [api|auth|cors|rate-limit|logger|timing|basic] [--root <dir>]");
      }
      console.log(
        `Created api middleware at ${createApiMiddlewareFile(projectRoot, {
          force,
          template: parseMiddlewareTemplate(generatePath && generatePath !== "api" ? generatePath : templateValue)
        })}`
      );
      return;
    case "middleware-stack":
      console.log(
        `Created middleware stack at ${createMiddlewareStackFile(projectRoot, parseMiddlewareStackTemplate(generatePath), {
          force
        })}`
      );
      return;
    case "not-found":
      console.log(`Created not-found page at ${createNotFoundPageFile(projectRoot, { force })}`);
      return;
    case "error":
      console.log(`Created error page at ${createErrorPageFile(projectRoot, { force })}`);
      return;
    case "layout":
      if (!generatePath) {
        throw new Error("Usage: litoho generate layout <path> [--params <name[,name2]>] [--root <dir>]");
      }
      console.log(`Created layout at ${createLayoutFile(projectRoot, buildRoutePath(generatePath, params))}`);
      return;
    default:
      throw new Error(`Unknown generate target: ${rawGenerateTarget ?? "(missing)"}`);
  }
}

async function handleUiCommand(commandArgs: string[]) {
  const [subcommand, ...rest] = commandArgs;

  if (subcommand === "add") {
    await handleAddUiCommand(rest);
    return;
  }

  if (subcommand === "list") {
    printUiRegistry();
    return;
  }

  if (subcommand === "diff") {
    await handleDiffUiCommand(rest);
    return;
  }

  if (subcommand === "info") {
    printUiInfo(rest[0]);
    return;
  }

  if (subcommand === "upgrade") {
    await handleUpgradeUiCommand(rest);
    return;
  }

  throw new Error(`Unknown ui command: ${subcommand ?? "(missing)"}`);
}

async function handleAddCommand(commandArgs: string[]) {
  const [namespace, ...rest] = commandArgs;

  if (namespace === "ui") {
    const [next, ...remaining] = rest;

    if (next === "list") {
      printUiRegistry();
      return;
    }

    if (next === "diff") {
      await handleDiffUiCommand(remaining);
      return;
    }

    if (next === "info") {
      printUiInfo(remaining[0]);
      return;
    }

    if (next === "upgrade") {
      await handleUpgradeUiCommand(remaining);
      return;
    }

    await handleAddUiCommand(rest);
    return;
  }

  throw new Error(`Unknown add target: ${namespace ?? "(missing)"}`);
}

async function handleAddUiCommand(commandArgs: string[]) {
  const file = readFlagValue(commandArgs, "--file");
  const copyDir = readFlagValue(commandArgs, "--dir");
  const isCopy = commandArgs.includes("--copy");
  let filteredArgs = stripFlag(commandArgs, "--file");
  filteredArgs = stripFlag(filteredArgs, "--dir");
  filteredArgs = stripBooleanFlag(filteredArgs, "--copy");
  const componentNames = filteredArgs.filter((value) => !value.startsWith("--"));

  if (componentNames.length === 0) {
    throw new Error("Usage: litoho ui add <component...> [--copy] [--dir <path>] [--file <path>] [--root <dir>]");
  }

  const selection = expandUiSelection(componentNames);
  const results = addUiComponentsToProject(projectRoot, selection.components, {
    file,
    copy: isCopy,
    copyDir
  });

  const announcedImports = new Set<string>();

  for (const result of results) {
    if (announcedImports.has(result.importPath)) {
      continue;
    }

    announcedImports.add(result.importPath);
    console.log(`Added ${result.importPath} to ${result.targetFile}`);
  }

  if (isCopy && results[0]?.copiedFiles.length) {
    console.log(`Copied local UI files into ${copyDir ?? "app/components/ui"}`);
  }

  if (selection.presets.length > 0) {
    console.log(`Expanded presets: ${selection.presets.join(", ")}`);
  }
}

async function handleDiffUiCommand(commandArgs: string[]) {
  const copyDir = readFlagValue(commandArgs, "--dir");
  let filteredArgs = stripFlag(commandArgs, "--dir");
  const items = filteredArgs.filter((value) => !value.startsWith("--"));
  const selection = items.length > 0 ? expandUiSelection(items) : { components: [], presets: [], requestedComponents: [] };
  const reports = diffLocalUiComponents(projectRoot, selection.components, {
    copyDir
  });

  if (reports.length === 0) {
    console.log(`No local copied UI files found in ${copyDir ?? "app/components/ui"}`);
    return;
  }

  for (const report of reports) {
    console.log(`[${report.status}] ${report.file}`);
  }

  if (selection.presets.length > 0) {
    console.log(`Expanded presets: ${selection.presets.join(", ")}`);
  }
}

async function handleUpgradeUiCommand(commandArgs: string[]) {
  const copyDir = readFlagValue(commandArgs, "--dir");
  const force = commandArgs.includes("--force");
  let filteredArgs = stripFlag(commandArgs, "--dir");
  filteredArgs = stripBooleanFlag(filteredArgs, "--force");
  const items = filteredArgs.filter((value) => !value.startsWith("--"));
  const selection = items.length > 0 ? expandUiSelection(items) : { components: [], presets: [], requestedComponents: [] };
  const result = upgradeLocalUiComponents(projectRoot, selection.components, {
    copyDir,
    force
  });

  for (const filePath of result.created) {
    console.log(`[created] ${filePath}`);
  }

  for (const filePath of result.updated) {
    console.log(`[updated] ${filePath}`);
  }

  for (const filePath of result.unchanged) {
    console.log(`[unchanged] ${filePath}`);
  }

  for (const filePath of result.skipped) {
    console.log(`[skipped] ${filePath} (use --force to overwrite local changes)`);
  }

  if (
    result.created.length === 0 &&
    result.updated.length === 0 &&
    result.unchanged.length === 0 &&
    result.skipped.length === 0
  ) {
    console.log(`No local copied UI files found in ${copyDir ?? "app/components/ui"}`);
  }

  if (selection.presets.length > 0) {
    console.log(`Expanded presets: ${selection.presets.join(", ")}`);
  }
}

function printUiRegistry() {
  console.log(`UI Components`);

  for (const [name, metadata] of Object.entries(UI_COMPONENT_REGISTRY)) {
    console.log(`- ${name}: ${metadata.description}`);
  }

  console.log(`\nUI Presets`);

  for (const [name, preset] of Object.entries(UI_PRESET_REGISTRY)) {
    console.log(`- ${name}: ${preset.components.join(", ")}${preset.description ? ` — ${preset.description}` : ""}`);
  }
}

function printUiInfo(name?: string) {
  if (!name) {
    throw new Error("Usage: litoho ui info <component|preset> [--root <dir>]");
  }

  const normalized = name.trim().toLowerCase();

  if (normalized in UI_COMPONENT_REGISTRY) {
    const metadata = UI_COMPONENT_REGISTRY[normalized as keyof typeof UI_COMPONENT_REGISTRY];
    console.log(`${normalized}`);
    console.log(`title: ${metadata.title}`);
    console.log(`module: @litoho/ui/${metadata.module}`);
    console.log(`description: ${metadata.description}`);
    console.log(`tags: ${metadata.tags.join(", ")}`);
    console.log(`snippet:\n${metadata.snippet}`);
    return;
  }

  if (normalized in UI_PRESET_REGISTRY) {
    const preset = UI_PRESET_REGISTRY[normalized as keyof typeof UI_PRESET_REGISTRY];
    console.log(`${normalized}`);
    console.log(`title: ${preset.title}`);
    console.log(`description: ${preset.description}`);
    console.log(`components: ${preset.components.join(", ")}`);
    return;
  }

  throw new Error(`Unknown UI component or preset: ${name}`);
}

function runLocalCommand(cwd: string, binary: string, commandArgs: string[], env: Record<string, string> = {}) {
  const result = spawnSync("pnpm", ["exec", binary, ...commandArgs], {
    cwd,
    env: {
      ...process.env,
      ...env
    },
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function runDevCommand(cwd: string) {
  logManifestGeneration("initial");
  generateRouteManifests(cwd);

  const watchers = createManifestWatchers(cwd);
  const child = spawn("pnpm", ["exec", "tsx", "watch", "server.ts"], {
    cwd,
    env: process.env,
    stdio: "inherit"
  });

  const cleanup = () => {
    for (const stopWatching of watchers) {
      stopWatching();
    }
  };

  child.on("exit", (code, signal) => {
    cleanup();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      cleanup();
      child.kill(signal);
    });
  }
}

function createManifestWatchers(cwd: string) {
  const watchTargets = ["app/pages", "app/api", "src/generated", "server.ts"]
    .map((relativePath) => resolve(cwd, relativePath))
    .filter((path) => existsSync(path));
  let suppressGeneratedUntil = 0;

  return watchTargets.map((target) => {
    let timeout: NodeJS.Timeout | undefined;

    const watcher = watch(target, { recursive: true }, () => {
      if (target.endsWith("/src/generated") || target.endsWith("\\src\\generated")) {
        if (Date.now() < suppressGeneratedUntil) {
          return;
        }
      }

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        try {
          logManifestGeneration("update", target);
          suppressGeneratedUntil = Date.now() + 250;
          generateRouteManifests(cwd);
        } catch (error) {
          console.error("[litoho dev] Failed to regenerate route manifests.");
          console.error(error);
        }
      }, 80);
    });

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }

      watcher.close();
    };
  });
}

function logManifestGeneration(kind: "initial" | "update", target?: string) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  if (kind === "initial") {
    console.log(`[litoho dev ${timestamp}] generated route manifests`);
    return;
  }

  console.log(`[litoho dev ${timestamp}] regenerated route manifests from ${target}`);
}

function printHelp() {
  console.log(`Litoho CLI

Usage:
  litoho new <name>
  litoho dev [--root <dir>]
  litoho build [--root <dir>]
  litoho start [--root <dir>]
  litoho doctor [--root <dir>]
  litoho ui add <component...> [--copy] [--dir <path>] [--file <path>] [--root <dir>]
  litoho ui diff [component|preset...] [--dir <path>] [--root <dir>]
  litoho ui list
  litoho ui info <component|preset>
  litoho ui upgrade [component|preset...] [--dir <path>] [--force] [--root <dir>]
  litoho add ui <component...> [--copy] [--dir <path>] [--file <path>] [--root <dir>]
  litoho a ui <component...> [--copy] [--dir <path>] [--file <path>] [--root <dir>]
  litoho generate routes [--root <dir>]
  litoho g routes [--root <dir>]
  litoho generate page <path> [--params <name[,name2]>] [--ssr] [--csr] [--throw-demo] [--template <client-counter|server-data|api-inspector|not-found-demo>] [--root <dir>]
  litoho -g page <path> [--params <name[,name2]>] [--ssr] [--csr] [--throw-demo] [--template <client-counter|server-data|api-inspector|not-found-demo>] [--root <dir>]
  litoho g p <path> [--params <name[,name2]>] [--ssr] [--csr] [--throw-demo] [--template <client-counter|server-data|api-inspector|not-found-demo>] [--root <dir>]
  litoho generate api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  litoho -g api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  litoho g a <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  litoho generate resource <name> [--params <name[,name2]>] [--root <dir>]
  litoho g r <name> [--params <name[,name2]>] [--root <dir>]
  litoho generate middleware [api|auth|cors|rate-limit|basic|logger|timing] [--template <basic|logger|auth|cors|rate-limit|timing>] [--force] [--root <dir>]
  litoho g m [api|auth|cors|rate-limit|basic|logger|timing] [--template <basic|logger|auth|cors|rate-limit|timing>] [--force] [--root <dir>]
  litoho generate middleware-stack <web|api|secure-api|browser-app> [--force] [--root <dir>]
  litoho g ms <web|api|secure-api|browser-app> [--force] [--root <dir>]
  litoho generate not-found [--force] [--root <dir>]
  litoho g nf [--force] [--root <dir>]
  litoho generate error [--force] [--root <dir>]
  litoho g err [--force] [--root <dir>]
  litoho generate layout <path> [--params <name[,name2]>] [--root <dir>]
  litoho g l <path> [--params <name[,name2]>] [--root <dir>]

Examples:
  litoho new blog-app
  litoho ui list
  litoho ui diff
  litoho ui info dialog
  litoho ui info form
  litoho ui add badge
  litoho ui add form
  litoho ui add overlay --copy
  litoho ui upgrade
  litoho ui upgrade overlay --force
  litoho ui add badge button card
  litoho ui add dialog tabs --copy
  litoho add ui dialog --file app/pages/admin/_layout.ts
  litoho generate page docs/getting-started
  litoho -g page docs/getting-started
  litoho g p docs/getting-started
  litoho g p counter-lab --template client-counter
  litoho g p server-snapshot --template server-data
  litoho g p api-lab --template api-inspector
  litoho g p missing-lab --template not-found-demo
  litoho g p failure-lab --throw-demo
  litoho -g page products --params id
  # creates app/pages/docs/getting-started/_index.ts
  litoho generate api users --params id
  litoho g a products --params id --query q:number,draft:boolean,tag:strings
  litoho -g api users --params id,postId
  litoho g a users --params id
  litoho generate resource products --params id
  litoho g r products --params id
  litoho generate middleware --template logger
  litoho g middleware auth
  litoho g middleware cors
  litoho g middleware rate-limit
  litoho g m --template auth --force
  litoho g m --template timing --force
  litoho g ms web
  litoho g ms api --force
  litoho g ms secure-api --force
  litoho g ms browser-app --force
  litoho g nf
  litoho g err
  litoho generate layout docs --params slug
  litoho g l docs --params slug
  litoho doctor
`);
}

function readFlagValue(args: string[], flagName: string) {
  const flagIndex = args.indexOf(flagName);
  return flagIndex >= 0 ? args[flagIndex + 1] : undefined;
}

function stripFlag(args: string[], flagName: string) {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flagName) {
      index += 1;
      continue;
    }

    values.push(args[index]);
  }

  return values;
}

function stripBooleanFlag(args: string[], flagName: string) {
  return args.filter((arg) => arg !== flagName);
}

function readRepeatedFlagValues(args: string[], flagName: string) {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== flagName) continue;

    const rawValue = args[index + 1];
    if (!rawValue) continue;

    values.push(
      ...rawValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    );
    index += 1;
  }

  return values;
}

function stripRepeatedFlag(args: string[], flagName: string) {
  const values: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flagName) {
      index += 1;
      continue;
    }

    values.push(args[index]);
  }

  return values;
}

function readQueryFlags(args: string[]) {
  const rawValues = readRepeatedFlagValues(args, "--query");
  return rawValues.map(parseQueryField);
}

function buildRoutePath(basePath: string, params: string[]) {
  if (params.length === 0) {
    return basePath;
  }

  const normalizedBasePath = basePath.replace(/^\/+|\/+$/g, "");
  const dynamicSegments = params.map((param) => `[${param}]`);

  return [normalizedBasePath, ...dynamicSegments].filter(Boolean).join("/");
}

function normalizeGenerateTarget(value: string | undefined) {
  switch (value) {
    case "p":
      return "page";
    case "a":
      return "api";
    case "r":
      return "resource";
    case "m":
      return "middleware";
    case "ms":
      return "middleware-stack";
    case "nf":
      return "not-found";
    case "err":
      return "error";
    case "l":
      return "layout";
    default:
      return value;
  }
}

function parseQueryField(rawValue: string): ApiQueryField {
  const [key, type] = rawValue.split(":").map((value) => value.trim());

  if (!key || !type) {
    throw new Error(`Invalid query field "${rawValue}". Expected <key:type>.`);
  }

  if (!isApiQueryFieldType(type)) {
    throw new Error(`Invalid query type "${type}" for "${key}". Use string, number, boolean, or strings.`);
  }

  return {
    key,
    type
  };
}

function isApiQueryFieldType(value: string): value is ApiQueryField["type"] {
  return value === "string" || value === "number" || value === "boolean" || value === "strings";
}

function parseMiddlewareTemplate(value: string | undefined): MiddlewareTemplate | undefined {
  if (!value) {
    return undefined;
  }

  if (
    value === "basic" ||
    value === "logger" ||
    value === "auth" ||
    value === "timing" ||
    value === "cors" ||
    value === "rate-limit"
  ) {
    return value;
  }

  throw new Error(`Invalid middleware template "${value}". Use "basic", "logger", "auth", "cors", "rate-limit", or "timing".`);
}

function parsePageTemplate(value: string | undefined): PageTemplate | undefined {
  if (!value) {
    return undefined;
  }

  if (
    value === "client-counter" ||
    value === "server-data" ||
    value === "api-inspector" ||
    value === "not-found-demo"
  ) {
    return value;
  }

  throw new Error(
    `Invalid page template "${value}". Use "client-counter", "server-data", "api-inspector", or "not-found-demo".`
  );
}

function parseMiddlewareStackTemplate(value: string | undefined): MiddlewareStackTemplate {
  if (value === "web" || value === "api" || value === "secure-api" || value === "browser-app") {
    return value;
  }

  throw new Error(`Invalid middleware stack "${value ?? "(missing)"}". Use "web", "api", "secure-api", or "browser-app".`);
}

function isMiddlewareTemplateCandidate(value: string) {
  return value === "basic" || value === "logger" || value === "auth" || value === "timing" || value === "cors" || value === "rate-limit";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
