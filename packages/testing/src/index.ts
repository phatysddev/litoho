import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

export function createTempLitoProject(files: Record<string, string>) {
  const rootDir = mkdtempSync(join(tmpdir(), "lito-testing-"));

  for (const [relativePath, contents] of Object.entries(files)) {
    const filePath = resolve(rootDir, relativePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents);
  }

  return {
    rootDir,
    cleanup() {
      rmSync(rootDir, { recursive: true, force: true });
    }
  };
}
