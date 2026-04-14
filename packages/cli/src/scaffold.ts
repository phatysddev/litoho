import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function createPageFile(rootDir: string, routePath: string, options: { mode?: "client" | "server" } = {}) {
  const targetFile = resolve(rootDir, "app/pages", normalizePagePath(routePath));
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile)) {
    throw new Error(`Page already exists: ${targetFile}`);
  }

  const directive = options.mode === "client" ? '"use client";\n\n' : options.mode === "server" ? '"use server";\n\n' : '';

  writeFileSync(
    targetFile,
    `${directive}import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>New Page</h1>
      <p>Edit ${escapeTemplateLiteral(targetFile)} to continue.</p>
    </main>
  \`
};

export default page;
`
  );

  return targetFile;
}

export type ApiQueryFieldType = "string" | "number" | "boolean" | "strings";

export type ApiQueryField = {
  key: string;
  type: ApiQueryFieldType;
};

export function createApiFile(rootDir: string, routePath: string, options: { queryFields?: ApiQueryField[] } = {}) {
  const targetFile = resolve(rootDir, "app/api", normalizeApiPath(routePath));
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile)) {
    throw new Error(`API route already exists: ${targetFile}`);
  }

  writeFileSync(targetFile, createApiModuleTemplate(routePath, options));

  return targetFile;
}

export function createLayoutFile(rootDir: string, layoutPath: string) {
  const targetFile = resolve(rootDir, "app/pages", normalizeLayoutPath(layoutPath));
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile)) {
    throw new Error(`Layout already exists: ${targetFile}`);
  }

  writeFileSync(
    targetFile,
    `import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule = {
  render: ({ children }) => children
};

export default layout;
`
  );

  return targetFile;
}

export function createNewApp(rootDir: string) {
  const appName = rootDir.split(/[/\\]/).pop() ?? "lito-app";
  mkdirSync(resolve(rootDir, "app/pages"), { recursive: true });
  mkdirSync(resolve(rootDir, "app/api"), { recursive: true });
  mkdirSync(resolve(rootDir, "src/generated"), { recursive: true });
  mkdirSync(resolve(rootDir, "src"), { recursive: true });

  const packageJsonPath = resolve(rootDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    writeFileSync(
      packageJsonPath,
      JSON.stringify(
        {
          name: appName,
          private: true,
          type: "module",
          scripts: {
            "generate:routes": "pnpm --filter @lito/cli build && pnpm exec lito generate routes --root .",
            dev: "pnpm exec lito dev --root .",
            build: "pnpm exec lito build --root .",
            start: "pnpm exec lito start --root ."
          },
          dependencies: {
            "@lito/app": "workspace:*",
            "@lito/server": "workspace:*",
            "lit": "^3.2.0"
          },
          devDependencies: {
            "@lito/cli": "workspace:*"
            ,
            "tsx": "^4.19.2",
            "typescript": "^5.8.3",
            "vite": "^5.4.19"
          }
        },
        null,
        2
      ) + "\n"
    );
  }

  const tsconfigPath = resolve(rootDir, "tsconfig.json");
  if (!existsSync(tsconfigPath)) {
    writeFileSync(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            lib: ["ES2022", "DOM", "DOM.Iterable"],
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            useDefineForClassFields: false,
            experimentalDecorators: true,
            noEmit: true
          },
          include: ["src/**/*.ts", "app/**/*.ts", "server.ts", "vite.config.ts"]
        },
        null,
        2
      ) + "\n"
    );
  }

  const viteConfigPath = resolve(rootDir, "vite.config.ts");
  if (!existsSync(viteConfigPath)) {
    writeFileSync(
      viteConfigPath,
      `import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  plugins: [
    {
      name: "lito-strip-route-directives",
      enforce: "pre",
      transform(code, id) {
        if (!id.includes("/app/pages/")) {
          return null;
        }

        return {
          code: code.replace(/^(['"])use (client|server)\\1;\\s*/, ""),
          map: null
        };
      }
    },
    {
      name: "lito-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        if (!options?.ssr && (id.includes("/app/api/") || id.endsWith("/app/api"))) {
          throw new Error(\`\\n\\n[LITO] Protection Error:\\nCannot import backend API route '\${id}' in a Client context!\\n(Imported by \${importer})\\n\\n\`);
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
`
    );
  }

  const indexHtmlPath = resolve(rootDir, "index.html");
  if (!existsSync(indexHtmlPath)) {
    writeFileSync(
      indexHtmlPath,
      `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lito App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`
    );
  }

  const mainEntryPath = resolve(rootDir, "src/main.ts");
  if (!existsSync(mainEntryPath)) {
    writeFileSync(
      mainEntryPath,
      `import { bootLitoClient } from "@lito/app";\nimport { pageManifest } from "./generated/page-manifest.js";\n\nbootLitoClient({ pageManifest });\n`
    );
  }

  const serverEntryPath = resolve(rootDir, "server.ts");
  if (!existsSync(serverEntryPath)) {
    writeFileSync(
      serverEntryPath,
      `import { scanApiRoutesFromManifest, scanPageRoutesFromManifest } from "@lito/app";
import { resolve } from "node:path";
import { startLitoNodeApp } from "@lito/server";
import { apiModulePaths } from "./src/generated/api-manifest";
import { pageManifest } from "./src/generated/page-manifest";

const manifestBaseUrl = new URL("./src/generated/", import.meta.url);
const pages = await scanPageRoutesFromManifest({
  manifestBaseUrl,
  pageManifest
});
const apiRoutes = await scanApiRoutesFromManifest({
  manifestBaseUrl,
  apiModulePaths
});

await startLitoNodeApp({
  appName: "Lito App",
  rootDir: resolve(process.cwd()),
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  port: Number(process.env.PORT ?? 3000),
  pages,
  apiRoutes
});

console.log(\`Lito app is running at http://localhost:\${process.env.PORT ?? 3000}\`);
`
    );
  }

  const indexPagePath = resolve(rootDir, "app/pages/_index.ts");
  if (!existsSync(indexPagePath)) {
    writeFileSync(
      indexPagePath,
      `import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Welcome to Lito"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Welcome to Lito</h1>
      <p>Your app scaffold is ready.</p>
    </main>
  \`
};

export default page;
`
    );
  }

  const rootLayoutPath = resolve(rootDir, "app/pages/_layout.ts");
  if (!existsSync(rootLayoutPath)) {
    writeFileSync(
      rootLayoutPath,
      `import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Lito App"
  }),
  render: ({ children }) => html\`
    <div style="min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);">
      \${children}
    </div>
  \`
};

export default layout;
`
    );
  }

  const healthApiPath = resolve(rootDir, "app/api/health.ts");
  if (!existsSync(healthApiPath)) {
    writeFileSync(
      healthApiPath,
      `export function get() {
  return Response.json({ ok: true });
}
`
    );
  }

  const gitkeepPath = resolve(rootDir, "src/generated/.gitkeep");
  if (!existsSync(gitkeepPath)) {
    writeFileSync(gitkeepPath, "");
  }
}

export function createCrudResource(rootDir: string, resourceName: string) {
  const baseName = stripSlashes(resourceName);
  const label = titleCase(baseName.split("/").pop() ?? baseName);

  const createdFiles = [
    createPageFile(rootDir, `${baseName}/_index`),
    createPageFile(rootDir, `${baseName}/new`),
    createPageFile(rootDir, `${baseName}/[id]`),
    createPageFile(rootDir, `${baseName}/[id]/edit`),
    createApiFile(rootDir, `${baseName}`),
    createApiFile(rootDir, `${baseName}/[id]`)
  ];

  overwriteFile(
    resolve(rootDir, "app/pages", `${baseName}/_index.ts`),
    `import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "${label} List"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>${label} List</h1>
      <p>Read all ${baseName} records here.</p>
      <ul>
        <li><a href="/${baseName}/new">Create new ${label.toLowerCase()}</a></li>
        <li><a href="/${baseName}/1">Open ${label} #1</a></li>
      </ul>
    </main>
  \`
};

export default page;
`
  );

  overwriteFile(
    resolve(rootDir, "app/pages", `${baseName}/new/_index.ts`),
    `import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Create ${label}"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Create ${label}</h1>
      <p>This page represents the create flow for ${baseName}.</p>
    </main>
  \`
};

export default page;
`
  );

  overwriteFile(
    resolve(rootDir, "app/pages", `${baseName}/[id]/_index.ts`),
    `import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "${label} Detail"
  },
  render: ({ params }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>${label} Detail</h1>
      <p>Viewing ${label.toLowerCase()} with id <strong>\${params.id}</strong>.</p>
      <p><a href="/${baseName}/\${params.id}/edit">Edit this ${label.toLowerCase()}</a></p>
    </main>
  \`
};

export default page;
`
  );

  overwriteFile(
    resolve(rootDir, "app/pages", `${baseName}/[id]/edit/_index.ts`),
    `import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Edit ${label}"
  },
  render: ({ params }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Edit ${label}</h1>
      <p>Updating ${label.toLowerCase()} with id <strong>\${params.id}</strong>.</p>
    </main>
  \`
};

export default page;
`
  );

  overwriteFile(
    resolve(rootDir, "app/api", `${baseName}.ts`),
    `import { defineApiRoute } from "@lito/server";

const route = defineApiRoute({
  get: () =>
    Response.json({
      ok: true,
      resource: ${JSON.stringify(baseName)},
      action: "list"
    }),
  post: () =>
    Response.json({
      ok: true,
      resource: ${JSON.stringify(baseName)},
      action: "create"
    })
});

export default route;
`
  );

  overwriteFile(
    resolve(rootDir, "app/api", `${baseName}/[id].ts`),
    `import { defineApiRoute } from "@lito/server";

type ${titleCase(baseName).replace(/\s+/g, "")}DetailParams = {
  id: string;
};

const route = defineApiRoute<${titleCase(baseName).replace(/\s+/g, "")}DetailParams>({
  get: ({ params }) =>
    Response.json({
      ok: true,
      resource: ${JSON.stringify(baseName)},
      action: "detail",
      id: params.id
    }),
  put: ({ params }) =>
    Response.json({
      ok: true,
      resource: ${JSON.stringify(baseName)},
      action: "update",
      id: params.id
    }),
  delete: ({ params }) =>
    Response.json({
      ok: true,
      resource: ${JSON.stringify(baseName)},
      action: "delete",
      id: params.id
    })
});

export default route;
`
  );

  return createdFiles;
}

function ensureParentDirectory(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function normalizePagePath(routePath: string) {
  const cleanPath = stripSlashes(routePath);
  if (cleanPath === "") return "_index.ts";

  if (cleanPath === "_index" || cleanPath.endsWith("/_index")) {
    return `${cleanPath}.ts`;
  }

  if (cleanPath === "index" || cleanPath.endsWith("/index")) {
    return `${cleanPath.replace(/\/index$/, "/_index").replace(/^index$/, "_index")}.ts`;
  }

  return `${cleanPath}/_index.ts`;
}

function normalizeApiPath(routePath: string) {
  const cleanPath = stripSlashes(routePath);
  return cleanPath === "" ? "index.ts" : `${cleanPath}.ts`;
}

function normalizeLayoutPath(routePath: string) {
  const cleanPath = stripSlashes(routePath);
  return cleanPath === "" ? "_layout.ts" : `${cleanPath}/_layout.ts`;
}

function stripSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

function escapeTemplateLiteral(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
}

function titleCase(value: string) {
  return value
    .split(/[-_/]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function overwriteFile(filePath: string, content: string) {
  ensureParentDirectory(filePath);
  writeFileSync(filePath, content);
}

function createApiModuleTemplate(routePath: string, options: { queryFields?: ApiQueryField[] }) {
  const params = extractRouteParams(routePath);
  const typeBaseName = toIdentifier(titleCase(stripSlashes(routePath) || "root")) || "Root";
  const paramsTypeName = `${typeBaseName}Params`;
  const queryFields = options.queryFields ?? [];
  const hasParams = params.length > 0;
  const hasQuery = queryFields.length > 0;

  const imports = `import { defineApiRoute } from "@lito/server";`;
  const paramsTypeBlock = hasParams
    ? `\ntype ${paramsTypeName} = {\n${params.map((param) => `  ${param}: string;`).join("\n")}\n};\n`
    : "";
  const querySchemaBlock = hasQuery
    ? `\nconst query = {\n${queryFields.map((field) => `  ${field.key}: "${field.type}"`).join(",\n")}\n} as const;\n`
    : "";
  const generic = hasParams && hasQuery ? `<${paramsTypeName}, typeof query>` : hasParams ? `<${paramsTypeName}>` : "";
  const detailEntries = [
    `ok: true`,
    `route: ${JSON.stringify(routePath)}`
  ];

  if (hasParams) {
    detailEntries.push(`params: context.params`);
  }

  if (hasQuery) {
    detailEntries.push(`query: context.queryData`);
  }

  return `${imports}${paramsTypeBlock}${querySchemaBlock}
const route = defineApiRoute${generic}({
${hasQuery ? `  query,\n` : ""}  get: (context) => {
    return Response.json({
      ${detailEntries.join(",\n      ")}
    });
  }
});

export default route;
`;
}

function extractRouteParams(routePath: string) {
  return stripSlashes(routePath)
    .split("/")
    .filter((segment) => /^\[.+\]$/.test(segment))
    .map((segment) => segment.slice(1, -1));
}

function toIdentifier(value: string) {
  return value.replace(/[^a-zA-Z0-9]+/g, " ").trim().replace(/(?:^|\s+)(\w)/g, (_, char: string) => char.toUpperCase());
}
