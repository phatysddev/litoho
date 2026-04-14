import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

export function generateRouteManifests(projectRoot: string) {
  const pagesDirectory = resolve(projectRoot, "app/pages");
  const apiDirectory = resolve(projectRoot, "app/api");
  const generatedDirectory = resolve(projectRoot, "src/generated");

  mkdirSync(generatedDirectory, { recursive: true });

  const allPageFiles = collectTypeScriptFiles(pagesDirectory);
  const invalidPageFiles = allPageFiles.filter((filePath) => !isValidPageModuleFile(filePath));

  if (invalidPageFiles.length > 0) {
    throw new Error(
      [
        "Invalid page route files found in app/pages.",
        "Lito now requires folder-based pages that render only from `_index.ts` files.",
        "Allowed page module names are `_index.ts`, `_layout.ts`, `_not-found.ts`, and `_error.ts`.",
        "",
        ...invalidPageFiles.map((filePath) => {
          const relativePath = relative(projectRoot, filePath).replace(/\\/g, "/");
          return `- ${relativePath} -> move to ${suggestPageModulePath(projectRoot, filePath)}`;
        })
      ].join("\n")
    );
  }

  const pageFiles = allPageFiles.filter((filePath) => filePath.endsWith(`${sep}_index.ts`));
  const apiFiles = collectTypeScriptFiles(apiDirectory).filter((filePath) => !filePath.endsWith(`${sep}_middleware.ts`));

  const pageManifestEntriesString = pageFiles.map((filePath) => {
    const relativePagePath = relative(pagesDirectory, filePath).replace(/\\/g, "/");
    const layouts = collectLayoutChain(pagesDirectory, filePath).map((layoutPath) => {
      const normalizedPath = relative(pagesDirectory, layoutPath).replace(/\\/g, "/");
      const cleanPath = normalizedPath.replace(/\/?_layout\.ts$/, "");
      const key = cleanPath === "" ? "root" : cleanPath.replace(/\//g, ".");
      return `{ key: "${key}", loader: () => import("${toModuleSpecifier(generatedDirectory, layoutPath)}") }`;
    });

    const sourceCode = readFileSync(filePath, "utf-8");
    const mode = readRouteModeDirective(sourceCode);

    const modeProp = mode ? `,\n    mode: "${mode}"` : "";

    return `  {
    page: () => import("${toModuleSpecifier(generatedDirectory, filePath)}"),
    layouts: [${layouts.join(", ")}],
    routeId: "${createRouteId(relativePagePath)}",
    routePath: "${createRoutePath(relativePagePath)}"${modeProp}
  }`;
  }).join(",\n");

  const apiModulePaths = apiFiles.map((filePath) => toModuleSpecifier(generatedDirectory, filePath));

  writeFileSync(
    resolve(generatedDirectory, "page-manifest.ts"),
    `import type { LitoPageManifestEntry } from "@lito/app";\n\nexport const pageManifest: LitoPageManifestEntry[] = [\n${pageManifestEntriesString}\n];\n`
  );

  writeFileSync(
    resolve(generatedDirectory, "api-manifest.ts"),
    `export const apiModulePaths = ${JSON.stringify(apiModulePaths, null, 2)} as const;\n`
  );
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

function collectLayoutChain(pagesDirectory: string, pageFilePath: string): string[] {
  const relativePageDirectory = relative(pagesDirectory, dirname(pageFilePath));
  const segments = relativePageDirectory === "" ? [] : relativePageDirectory.split(sep);
  const layoutPaths: string[] = [];

  for (let index = 0; index <= segments.length; index += 1) {
    const directoryPath = resolve(pagesDirectory, ...segments.slice(0, index));
    const layoutPath = resolve(directoryPath, "_layout.ts");

    if (exists(layoutPath)) {
      layoutPaths.push(layoutPath);
    }
  }

  return layoutPaths;
}

function exists(pathname: string) {
  return existsSync(pathname);
}

function toModuleSpecifier(fromDirectory: string, filePath: string) {
  return relative(fromDirectory, filePath).replace(/\\/g, "/");
}

function createRouteId(relativePagePath: string) {
  const segments = relativePagePath
    .replace(/\.ts$/, "")
    .split("/")
    .flatMap((segment) => {
      if (segment === "_index") return [];
      return segment;
    });

  return segments.length === 0 ? "index" : segments.join(":");
}

function isValidPageModuleFile(filePath: string) {
  return (
    filePath.endsWith(`${sep}_index.ts`) ||
    filePath.endsWith(`${sep}_layout.ts`) ||
    filePath.endsWith(`${sep}_not-found.ts`) ||
    filePath.endsWith(`${sep}_error.ts`)
  );
}

function suggestPageModulePath(projectRoot: string, filePath: string) {
  const relativePath = relative(projectRoot, filePath).replace(/\\/g, "/");
  const withoutExtension = relativePath.replace(/\.ts$/, "");

  if (withoutExtension.endsWith("/index")) {
    return withoutExtension.replace(/\/index$/, "/_index.ts");
  }

  if (withoutExtension.endsWith("/_index") || withoutExtension.endsWith("/_layout")) {
    return `${withoutExtension}.ts`;
  }

  if (withoutExtension.endsWith("/_not-found") || withoutExtension.endsWith("/_error")) {
    return `${withoutExtension}.ts`;
  }

  return `${withoutExtension}/_index.ts`;
}

export function createRoutePath(relativePath: string, prefix = "") {
  const normalized = relativePath
    .replace(/\.ts$/, "")
    .split("/")
    .flatMap((segment) => {
      if (segment === "_index") return [];
      return segment;
    });
  const segments = normalized.flatMap((segment) => {
    if (/^\[.+\]$/.test(segment)) return `:${segment.slice(1, -1)}`;
    return segment;
  });
  const pathname = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  if (!prefix) return pathname;
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function readRouteModeDirective(sourceCode: string): "client" | "server" | undefined {
  const leadingSegment = sourceCode.match(/^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/)?.[0] ?? "";
  const remainingSource = sourceCode.slice(leadingSegment.length);
  const directiveMatch = remainingSource.match(/^(['"])use (client|server)\1\s*;/);

  if (!directiveMatch) {
    return undefined;
  }

  return directiveMatch[2] as "client" | "server";
}
