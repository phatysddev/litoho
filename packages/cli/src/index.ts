#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { formatDoctorReport, hasDoctorErrors, runLitoDoctor } from "./doctor.js";
import { generateRouteManifests } from "./generate-route-manifests.js";
import {
  createApiFile,
  createCrudResource,
  createLayoutFile,
  createNewApp,
  createPageFile,
  type ApiQueryField
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
        throw new Error("Usage: lito new <name>");
      }

      const appRoot = resolve(process.cwd(), appName);
      createNewApp(appRoot);
      console.log(`Created new Lito app at ${appRoot}`);
      return;
    }
    case "-g":
    case "generate":
    case "g":
      await handleGenerateCommand(restArgs);
      return;
    case "dev":
      generateRouteManifests(projectRoot);
      runLocalCommand(projectRoot, "tsx", ["server.ts"]);
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
  const isCsr = commandArgs.includes("--csr");
  const isSsr = commandArgs.includes("--ssr");
  let filteredArgs = stripRepeatedFlag(stripRepeatedFlag(commandArgs, "--params"), "--query");
  filteredArgs = stripBooleanFlag(filteredArgs, "--csr");
  filteredArgs = stripBooleanFlag(filteredArgs, "--ssr");
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
        throw new Error("Usage: lito generate page <path> [--params <name[,name2]>] [--ssr] [--csr] [--root <dir>]");
      }
      console.log(`Created page at ${createPageFile(projectRoot, buildRoutePath(generatePath, params), { mode })}`);
      return;
    case "api":
      if (!generatePath) {
        throw new Error("Usage: lito generate api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]");
      }
      console.log(
        `Created api route at ${createApiFile(projectRoot, buildRoutePath(generatePath, params), { queryFields })}`
      );
      return;
    case "resource":
      if (!generatePath) {
        throw new Error("Usage: lito generate resource <name> [--root <dir>]");
      }
      createCrudResource(projectRoot, buildRoutePath(generatePath, params));
      console.log(`Created CRUD resource for ${buildRoutePath(generatePath, params)}`);
      return;
    case "layout":
      if (!generatePath) {
        throw new Error("Usage: lito generate layout <path> [--params <name[,name2]>] [--root <dir>]");
      }
      console.log(`Created layout at ${createLayoutFile(projectRoot, buildRoutePath(generatePath, params))}`);
      return;
    default:
      throw new Error(`Unknown generate target: ${rawGenerateTarget ?? "(missing)"}`);
  }
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

function printHelp() {
  console.log(`Lito CLI

Usage:
  lito new <name>
  lito dev [--root <dir>]
  lito build [--root <dir>]
  lito start [--root <dir>]
  lito doctor [--root <dir>]
  lito generate routes [--root <dir>]
  lito g routes [--root <dir>]
  lito generate page <path> [--params <name[,name2]>] [--ssr] [--csr] [--root <dir>]
  lito -g page <path> [--params <name[,name2]>] [--ssr] [--csr] [--root <dir>]
  lito g p <path> [--params <name[,name2]>] [--ssr] [--csr] [--root <dir>]
  lito generate api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  lito -g api <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  lito g a <path> [--params <name[,name2]>] [--query <key:type[,key2:type2]>] [--root <dir>]
  lito generate resource <name> [--params <name[,name2]>] [--root <dir>]
  lito g r <name> [--params <name[,name2]>] [--root <dir>]
  lito generate layout <path> [--params <name[,name2]>] [--root <dir>]
  lito g l <path> [--params <name[,name2]>] [--root <dir>]

Examples:
  lito new blog-app
  lito generate page docs/getting-started
  lito -g page docs/getting-started
  lito g p docs/getting-started
  lito -g page products --params id
  # creates app/pages/docs/getting-started/_index.ts
  lito generate api users --params id
  lito g a products --params id --query q:number,draft:boolean,tag:strings
  lito -g api users --params id,postId
  lito g a users --params id
  lito generate resource products --params id
  lito g r products --params id
  lito generate layout docs --params slug
  lito g l docs --params slug
  lito doctor
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
