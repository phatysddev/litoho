import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export type LitoDoctorFinding = {
  kind: "error" | "warning" | "info";
  message: string;
};

export function runLitoDoctor(projectRoot: string): LitoDoctorFinding[] {
  const findings: LitoDoctorFinding[] = [];
  const pagesDirectory = resolve(projectRoot, "app/pages");
  const apiDirectory = resolve(projectRoot, "app/api");

  if (!existsSync(pagesDirectory)) {
    findings.push({
      kind: "error",
      message: "Missing `app/pages` directory."
    });
    return findings;
  }

  if (!existsSync(apiDirectory)) {
    findings.push({
      kind: "warning",
      message: "Missing `app/api` directory. API route scanning will be skipped."
    });
  }

  const pageFiles = collectTypeScriptFiles(pagesDirectory);
  const apiFiles = existsSync(apiDirectory) ? collectTypeScriptFiles(apiDirectory) : [];

  const invalidPageFiles = pageFiles.filter((filePath) => !isAllowedPageModuleFile(filePath));
  for (const filePath of invalidPageFiles) {
    findings.push({
      kind: "error",
      message: `${toRelative(projectRoot, filePath)} should be moved to ${suggestPageModulePath(projectRoot, filePath)}`
    });
  }

  const invalidApiFiles = apiFiles.filter((filePath) => !isAllowedApiModuleFile(filePath));
  for (const filePath of invalidApiFiles) {
    findings.push({
      kind: "warning",
      message: `${toRelative(projectRoot, filePath)} is a special API file name Lito does not recognize. Expected route modules or \`app/api/_middleware.ts\`.`
    });
  }

  if (!pageFiles.some((filePath) => filePath.endsWith(`${sep}_index.ts`))) {
    findings.push({
      kind: "error",
      message: "No page routes found. Add `app/pages/_index.ts` to define the root page."
    });
  }

  if (!pageFiles.some((filePath) => filePath.endsWith(`${sep}_not-found.ts`))) {
    findings.push({
      kind: "warning",
      message: "Missing `app/pages/_not-found.ts`. Requests for unknown routes will fall back to the generic 404 response."
    });
  }

  if (!pageFiles.some((filePath) => filePath.endsWith(`${sep}_error.ts`))) {
    findings.push({
      kind: "warning",
      message: "Missing `app/pages/_error.ts`. Page render failures will fall back to the generic 500 response."
    });
  }

  if (!apiFiles.some((filePath) => filePath.endsWith(`${sep}_middleware.ts`))) {
    findings.push({
      kind: "info",
      message: "No `app/api/_middleware.ts` found. Request middleware will only come from `server.ts`."
    });
  }

  if (invalidPageFiles.length === 0) {
    findings.push({
      kind: "info",
      message: "Page module naming follows the current `_index.ts` / `_layout.ts` / special page conventions."
    });
  }

  return findings;
}

export function formatDoctorReport(findings: readonly LitoDoctorFinding[]) {
  if (findings.length === 0) {
    return "Lito doctor found no issues.";
  }

  return findings
    .map((finding) => `[${finding.kind.toUpperCase()}] ${finding.message}`)
    .join("\n");
}

export function hasDoctorErrors(findings: readonly LitoDoctorFinding[]) {
  return findings.some((finding) => finding.kind === "error");
}

function collectTypeScriptFiles(directory: string): string[] {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }

  return files;
}

function isAllowedPageModuleFile(filePath: string) {
  return (
    filePath.endsWith(`${sep}_index.ts`) ||
    filePath.endsWith(`${sep}_layout.ts`) ||
    filePath.endsWith(`${sep}_not-found.ts`) ||
    filePath.endsWith(`${sep}_error.ts`)
  );
}

function isAllowedApiModuleFile(filePath: string) {
  const baseName = filePath.split(sep).at(-1) ?? "";
  return baseName !== "_index.ts" && (baseName === "_middleware.ts" || !baseName.startsWith("_"));
}

function suggestPageModulePath(projectRoot: string, filePath: string) {
  const relativePath = toRelative(projectRoot, filePath);
  const withoutExtension = relativePath.replace(/\.ts$/, "");

  if (withoutExtension.endsWith("/index")) {
    return withoutExtension.replace(/\/index$/, "/_index.ts");
  }

  return `${withoutExtension}/_index.ts`;
}

function toRelative(projectRoot: string, filePath: string) {
  return relative(projectRoot, filePath).replace(/\\/g, "/");
}
