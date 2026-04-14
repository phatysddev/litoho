import { readFileSync } from "node:fs";

export type LitoClientAssets = {
  scripts: string[];
  styles?: string[];
};

type ViteManifestEntry = {
  file: string;
  css?: string[];
  imports?: string[];
  isEntry?: boolean;
};

type ViteManifest = Record<string, ViteManifestEntry>;

export function createDevClientAssets(entry = "/src/main.ts"): LitoClientAssets {
  return {
    scripts: ["/@vite/client", entry]
  };
}

export function createManifestClientAssets(options: {
  manifestPath: string;
  entry?: string;
  basePath?: string;
}): LitoClientAssets {
  const manifest = readManifest(options.manifestPath);
  const entryKey = options.entry ?? resolveEntryKey(manifest);
  const entry = manifest[entryKey];

  if (!entry) {
    throw new Error(`Unable to find manifest entry "${entryKey}" in ${options.manifestPath}`);
  }

  const basePath = normalizeBasePath(options.basePath ?? "/");
  const scripts = new Set<string>();
  const styles = new Set<string>();

  collectManifestAssets({
    basePath,
    manifest,
    entryKey,
    scripts,
    styles
  });

  return {
    scripts: [...scripts],
    styles: [...styles]
  };
}

function readManifest(manifestPath: string): ViteManifest {
  const content = readFileSync(manifestPath, "utf8");
  return JSON.parse(content) as ViteManifest;
}

function resolveEntryKey(manifest: ViteManifest) {
  const entry = Object.entries(manifest).find(([, value]) => value.isEntry);

  if (!entry) {
    throw new Error("Unable to find a Vite entry chunk in manifest.");
  }

  return entry[0];
}

function collectManifestAssets(input: {
  basePath: string;
  manifest: ViteManifest;
  entryKey: string;
  scripts: Set<string>;
  styles: Set<string>;
}) {
  const entry = input.manifest[input.entryKey];

  if (!entry) {
    return;
  }

  input.scripts.add(withBasePath(input.basePath, entry.file));

  for (const style of entry.css ?? []) {
    input.styles.add(withBasePath(input.basePath, style));
  }

  for (const importKey of entry.imports ?? []) {
    collectManifestAssets({
      ...input,
      entryKey: importKey
    });
  }
}

function normalizeBasePath(basePath: string) {
  if (!basePath || basePath === "/") {
    return "/";
  }

  return basePath.endsWith("/") ? basePath : `${basePath}/`;
}

function withBasePath(basePath: string, assetPath: string) {
  const normalizedAssetPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  return basePath === "/" ? `/${normalizedAssetPath}` : `${basePath}${normalizedAssetPath}`;
}

