import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const LITOHO_VERSION = "^0.0.9";
const LITOHO_SCOPE = process.env.LITOHO_SCOPE?.trim() || "@litoho";
const LITOHO_CLI_PACKAGE = process.env.LITOHO_CLI_PACKAGE?.trim() || "litoho";
const LITOHO_CLI_BIN = process.env.LITOHO_CLI_BIN?.trim() || "litoho";

function scopedPackage(name: string) {
  return `${LITOHO_SCOPE}/${name}`;
}

const APP_PACKAGE = scopedPackage("app");
const SERVER_PACKAGE = scopedPackage("server");

export type PageTemplate = "default" | "client-counter" | "server-data" | "api-inspector" | "not-found-demo";

export function createPageFile(
  rootDir: string,
  routePath: string,
  options: { mode?: "client" | "server"; throwDemo?: boolean; template?: PageTemplate } = {}
) {
  const targetFile = resolve(rootDir, "app/pages", normalizePagePath(routePath));
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile)) {
    throw new Error(`Page already exists: ${targetFile}`);
  }

  const directive = options.mode === "client" ? '"use client";\n\n' : options.mode === "server" ? '"use server";\n\n' : '';

  writeFileSync(
    targetFile,
    options.throwDemo
      ? `${directive}import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";

const page: LitoPageModule = {
  document: {
    title: "Error Demo"
  },
  load: ({ query }) => {
    if (query.get("safe") === "1") {
      return {
        safe: true
      };
    }

    throw new Error("Intentional Litoho demo error from page load().");
  },
  render: ({ data }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Error Demo</h1>
      <p>The safe branch is active.</p>
      <pre>\${JSON.stringify(data, null, 2)}</pre>
    </main>
  \`
};

export default page;
`
      : options.template === "client-counter"
        ? `"use client";

import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";
import { memo, signal } from "${scopedPackage("core")}";

const count = signal(0);
const doubled = memo(() => count.value * 2);

const page: LitoPageModule = {
  document: {
    title: "Client Counter"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Client Counter</h1>
      <p>This page is scaffolded with the <code>client-counter</code> template.</p>
      <div style="display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 20px 0;">
        <div style="padding: 16px; border-radius: 16px; background: #e2e8f0;">
          <div style="font-size: 0.8rem; color: #475569;">Count</div>
          <div style="font-size: 2rem;">\${count.value}</div>
        </div>
        <div style="padding: 16px; border-radius: 16px; background: #dbeafe;">
          <div style="font-size: 0.8rem; color: #475569;">Doubled</div>
          <div style="font-size: 2rem;">\${doubled.value}</div>
        </div>
      </div>
      <div style="display: flex; gap: 12px;">
        <button @click=\${() => count.update((value) => value - 1)}>Decrease</button>
        <button @click=\${() => count.update((value) => value + 1)}>Increase</button>
      </div>
    </main>
  \`
};

export default page;
`
        : options.template === "server-data"
          ? `${directive || '"use server";\n\n'}import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";

type ServerData = {
  generatedAt: string;
  pathname: string;
  source: string;
};

const page: LitoPageModule<ServerData> = {
  document: {
    title: "Server Data"
  },
  load: ({ pathname, query }) => ({
    generatedAt: new Date().toISOString(),
    pathname,
    source: query.get("source") ?? "server"
  }),
  render: ({ data }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Server Data</h1>
      <p>This page is scaffolded with the <code>server-data</code> template.</p>
      <pre style="padding: 16px; border-radius: 16px; background: #0f172a; color: #e2e8f0; overflow: auto;">\${JSON.stringify(data, null, 2)}</pre>
    </main>
  \`
};

export default page;
`
        : options.template === "api-inspector"
          ? `"use client";

import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";
import { signal } from "${scopedPackage("core")}";

const payload = signal("Loading...");

const loadApi = async () => {
  payload.value = "Loading...";

  try {
    const response = await fetch("/api/request-info?source=inspector&token=demo-secret");
    payload.value = JSON.stringify(await response.json(), null, 2);
  } catch (error) {
    payload.value = String(error);
  }
};

const page: LitoPageModule = {
  document: {
    title: "API Inspector"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>API Inspector</h1>
      <p>This page is scaffolded with the <code>api-inspector</code> template.</p>
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <button @click=\${() => void loadApi()}>Fetch /api/request-info</button>
      </div>
      <pre style="padding: 16px; border-radius: 16px; background: #0f172a; color: #e2e8f0; overflow: auto;">\${payload.value}</pre>
    </main>
  \`
};

void loadApi();

export default page;
`
          : options.template === "not-found-demo"
            ? `${directive || '"use server";\n\n'}import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";

const page: LitoPageModule = {
  document: {
    title: "Not Found Demo"
  },
  render: () => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Not Found Demo</h1>
      <p>Open a route that does not exist, such as <a href="/missing-demo-route">/missing-demo-route</a>, to exercise <code>app/pages/_not-found.ts</code>.</p>
    </main>
  \`
};

export default page;
`
      : `${directive}import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";

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
    `import type { LitoLayoutModule } from "${APP_PACKAGE}";

const layout: LitoLayoutModule = {
  render: ({ children }) => children
};

export default layout;
`
  );

  return targetFile;
}

export type MiddlewareTemplate = "basic" | "logger" | "auth" | "timing" | "cors" | "rate-limit";
export type MiddlewareStackTemplate = "web" | "api" | "secure-api" | "browser-app";

export function createApiMiddlewareFile(
  rootDir: string,
  options: {
    force?: boolean;
    template?: MiddlewareTemplate;
  } = {}
) {
  const targetFile = resolve(rootDir, "app/api/_middleware.ts");
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile) && !options.force) {
    throw new Error(`API middleware already exists: ${targetFile}`);
  }

  writeFileSync(targetFile, createApiMiddlewareTemplate(options.template ?? "basic"));

  return targetFile;
}

export function createMiddlewareStackFile(
  rootDir: string,
  stack: MiddlewareStackTemplate,
  options: { force?: boolean } = {}
) {
  const targetFile = resolve(rootDir, "app/api/_middleware.ts");
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile) && !options.force) {
    throw new Error(`API middleware already exists: ${targetFile}`);
  }

  writeFileSync(targetFile, createMiddlewareStackTemplate(stack));

  return targetFile;
}

export function createNotFoundPageFile(rootDir: string, options: { force?: boolean } = {}) {
  const targetFile = resolve(rootDir, "app/pages/_not-found.ts");
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile) && !options.force) {
    throw new Error(`Not-found page already exists: ${targetFile}`);
  }

  writeFileSync(
    targetFile,
    `import { html } from "lit";
import type { LitoNotFoundModule } from "${APP_PACKAGE}";

const page: LitoNotFoundModule = {
  document: {
    title: "Page Not Found"
  },
  render: ({ pathname }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>404</h1>
      <p>No route matched <code>\${pathname}</code>.</p>
      <p><a href="/">Back to home</a></p>
    </main>
  \`
};

export default page;
`
  );

  return targetFile;
}

export function createErrorPageFile(rootDir: string, options: { force?: boolean } = {}) {
  const targetFile = resolve(rootDir, "app/pages/_error.ts");
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile) && !options.force) {
    throw new Error(`Error page already exists: ${targetFile}`);
  }

  writeFileSync(
    targetFile,
    `import { html } from "lit";
import type { LitoErrorModule } from "${APP_PACKAGE}";

const page: LitoErrorModule = {
  document: ({ status }) => ({
    title: \`Server Error \${status}\`
  }),
  render: ({ status, error }) => html\`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>\${status}</h1>
      <p>Litoho caught a page render failure.</p>
      <pre style="padding: 16px; border-radius: 16px; background: #0f172a; color: #e2e8f0; overflow: auto;">\${String(error)}</pre>
      <p><a href="/">Back to home</a></p>
    </main>
  \`
};

export default page;
`
  );

  return targetFile;
}

export function createNewApp(rootDir: string) {
  const appName = rootDir.split(/[/\\]/).pop() ?? "litoho-app";
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
            "generate:routes": `npm exec ${LITOHO_CLI_BIN} -- generate routes --root .`,
            dev: `npm exec ${LITOHO_CLI_BIN} -- dev --root .`,
            build: `npm exec ${LITOHO_CLI_BIN} -- build --root .`,
            start: `npm exec ${LITOHO_CLI_BIN} -- start --root .`
          },
          dependencies: {
            [scopedPackage("app")]: LITOHO_VERSION,
            [scopedPackage("core")]: LITOHO_VERSION,
            [scopedPackage("server")]: LITOHO_VERSION,
            "lit": "^3.2.0"
          },
          devDependencies: {
            "@tailwindcss/vite": "^4.1.11",
            [LITOHO_CLI_PACKAGE]: LITOHO_VERSION,
            "tailwindcss": "^4.1.11",
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
      `import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  plugins: [
    tailwindcss(),
    {
      name: "litoho-strip-route-directives",
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
      name: "litoho-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        const isApiRouteImport = id.includes("/app/api/") || id.endsWith("/app/api");
        const isClientModuleImporter = typeof importer === "string" && /[.][cm]?[jt]sx?$/.test(importer);
        if (!options?.ssr && isApiRouteImport && isClientModuleImporter) {
          throw new Error(\`\\n\\n[LITOHO] Protection Error:\\nCannot import backend API route '\${id}' in a Client context!\\n(Imported by \${importer})\\n\\n\`);
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
    <title>Litoho App</title>
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
      `import { bootLitoClient } from "${APP_PACKAGE}";
import "./styles.css";
import { pageManifest } from "./generated/page-manifest.js";

bootLitoClient({ pageManifest });
`
    );
  }

  const stylesEntryPath = resolve(rootDir, "src/styles.css");
  if (!existsSync(stylesEntryPath)) {
    writeFileSync(
      stylesEntryPath,
      `@import "tailwindcss";

@theme {
  --color-lito-ink: #07111f;
  --color-lito-gold: #facc15;
  --color-lito-mist: #dbe7f5;
  --font-sans: "Inter", "Segoe UI", sans-serif;
}

@layer base {
  html {
    background: radial-gradient(circle at top, #163051 0%, #08101d 42%, #020611 100%);
  }

  body {
    min-height: 100vh;
    color: #f8fafc;
  }
}
`
    );
  }

  const serverEntryPath = resolve(rootDir, "server.ts");
  if (!existsSync(serverEntryPath)) {
    writeFileSync(
      serverEntryPath,
      `import { loadLitoAppFromManifest } from "${APP_PACKAGE}";
import { resolve } from "node:path";
import { startLitoNodeApp } from "${SERVER_PACKAGE}";
import { apiModulePaths } from "./src/generated/api-manifest";
import { pageManifest } from "./src/generated/page-manifest";

const manifestBaseUrl = new URL("./src/generated/", import.meta.url);
const app = await loadLitoAppFromManifest({
  manifestBaseUrl,
  pageManifest,
  apiModulePaths
});

await startLitoNodeApp({
  appName: "Litoho App",
  rootDir: resolve(process.cwd()),
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  port: Number(process.env.PORT ?? 3000),
  pages: app.pages,
  apiRoutes: app.apiRoutes,
  middlewares: app.middlewares,
  notFoundPage: app.notFoundPage,
  errorPage: app.errorPage
});

console.log(\`Litoho app is running at http://localhost:\${process.env.PORT ?? 3000}\`);
`
    );
  }

  const indexPagePath = resolve(rootDir, "app/pages/_index.ts");
  if (!existsSync(indexPagePath)) {
    writeFileSync(
      indexPagePath,
      `import { html } from "lit";
import type { LitoPageModule } from "${APP_PACKAGE}";

const page: LitoPageModule = {
  document: {
    title: "Welcome to Litoho"
  },
  render: () => html\`
    <main class="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center px-6 py-16 sm:px-8">
      <section class="grid w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
        <div>
          <div class="mb-5 inline-flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-lito-gold">
            <span class="h-px w-10 bg-current"></span>
            Litoho
          </div>
          <h1 class="max-w-4xl text-5xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-7xl lg:text-8xl">
            Build calm,
            <span class="block text-lito-gold">fast full-stack UI.</span>
          </h1>
          <p class="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Your app scaffold is ready with file-based routing, SSR, Lit, and Tailwind CSS already wired into the client
            entry.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a
              class="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-lito-ink transition hover:-translate-y-0.5"
              href="/api/health"
            >
              Open health API
            </a>
            <a
              class="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-lito-gold/50"
              href="https://tailwindcss.com/docs/installation/using-vite"
            >
              Tailwind docs
            </a>
          </div>
        </div>

        <aside class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p class="text-xs uppercase tracking-[0.3em] text-lito-gold">Starter stack</p>
          <h2 class="mt-3 text-2xl font-semibold text-white">Tailwind + Lit</h2>
          <p class="mt-3 text-sm leading-7 text-slate-300">
            Start with framework primitives first, then layer your own design system or external UI package when needed.
          </p>
          <div class="mt-5 space-y-3">
            <input
              class="w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400"
              placeholder="Name your first view"
            />
            <div class="flex flex-wrap gap-3">
              <a
                class="inline-flex min-h-11 items-center justify-center rounded-full bg-lito-gold px-5 text-sm font-semibold text-lito-ink transition hover:-translate-y-0.5"
                href="/api/health"
              >
                Health API
              </a>
              <a
                class="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                href="https://tailwindcss.com/docs/installation/using-vite"
              >
                Tailwind docs
              </a>
            </div>
          </div>
        </aside>
      </section>
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
import type { LitoLayoutModule } from "${APP_PACKAGE}";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Litoho App"
  }),
  render: ({ children, data }) => html\`
    <div class="min-h-screen bg-transparent">
      <header class="sticky top-0 z-10 border-b border-white/10 bg-slate-950/65 backdrop-blur">
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <a href="/" class="text-sm font-semibold uppercase tracking-[0.28em] text-white">\${data.appName}</a>
          <nav class="flex items-center gap-4 text-sm text-slate-300">
            <a class="transition hover:text-white" href="/">Home</a>
            <a class="transition hover:text-white" href="/api/health">API</a>
          </nav>
        </div>
      </header>
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
import type { LitoPageModule } from "${APP_PACKAGE}";

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
import type { LitoPageModule } from "${APP_PACKAGE}";

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
import type { LitoPageModule } from "${APP_PACKAGE}";

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
import type { LitoPageModule } from "${APP_PACKAGE}";

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
    `import { defineApiRoute } from "${SERVER_PACKAGE}";

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
    `import { defineApiRoute } from "${SERVER_PACKAGE}";

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

  const imports = `import { defineApiRoute } from "${SERVER_PACKAGE}";`;
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

function createApiMiddlewareTemplate(template: MiddlewareTemplate) {
  if (template === "basic") {
    return `import { createRequestMetaMiddleware } from "${SERVER_PACKAGE}";

export default createRequestMetaMiddleware();
`;
  }

  if (template === "auth") {
    return `import { requireAuth, unauthorized } from "${SERVER_PACKAGE}";

export default requireAuth({
  protectedPathPrefixes: ["/docs"],
  unauthorizedResponse: unauthorized("Unauthorized", {
    headers: {
      "content-type": "text/plain; charset=utf-8"
    }
  })
});
`;
  }

  if (template === "timing") {
    return `import { createTimingMiddleware } from "${SERVER_PACKAGE}";

export default createTimingMiddleware();
`;
  }

  if (template === "cors") {
    return `import { withCors } from "${SERVER_PACKAGE}";

export default withCors({
  allowOrigin: "*",
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
});
`;
  }

  if (template === "rate-limit") {
    return `import { withRateLimit } from "${SERVER_PACKAGE}";

export default withRateLimit({
  limit: 60,
  windowMs: 60_000
});
`;
  }

  if (template === "logger") {
    return `import {
  composeMiddlewares,
  createLoggerMiddleware,
  createRequestMetaMiddleware,
  createTimingMiddleware
} from "${SERVER_PACKAGE}";

export default composeMiddlewares(
  createRequestMetaMiddleware(),
  createTimingMiddleware(),
  createLoggerMiddleware()
);
`;
  }

  return `import { createRequestMetaMiddleware } from "${SERVER_PACKAGE}";

export default createRequestMetaMiddleware();
`;
}

function createMiddlewareStackTemplate(stack: MiddlewareStackTemplate) {
  if (stack === "api") {
    return `import {
  composeMiddlewares,
  createAuthGuardMiddleware,
  createLoggerMiddleware,
  createRequestMetaMiddleware,
  createTimingMiddleware,
  json
} from "${SERVER_PACKAGE}";

export default composeMiddlewares(
  createRequestMetaMiddleware(),
  createAuthGuardMiddleware({
    protectedPathPrefixes: ["/api"],
    unauthorizedResponse: json(
      {
        ok: false,
        error: {
          message: "Unauthorized"
        }
      },
      {
        status: 401
      }
    )
  }),
  createTimingMiddleware(),
  createLoggerMiddleware()
);
`;
  }

  if (stack === "secure-api") {
    return `import {
  composeMiddlewares,
  createLoggerMiddleware,
  json,
  requireAuth,
  withCacheControl,
  withCors,
  withRateLimit,
  withRequestId,
  withSecurityHeaders
} from "${SERVER_PACKAGE}";

export default composeMiddlewares(
  withRequestId(),
  withSecurityHeaders(),
  withCors({
    allowOrigin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  }),
  requireAuth({
    protectedPathPrefixes: ["/api"],
    unauthorizedResponse: json(
      {
        ok: false,
        error: {
          message: "Unauthorized"
        }
      },
      {
        status: 401
      }
    )
  }),
  withRateLimit({
    protectedPathPrefixes: ["/api"],
    limit: 120,
    windowMs: 60_000
  }),
  withCacheControl({
    protectedPathPrefixes: ["/api"],
    value: "no-store"
  }),
  createLoggerMiddleware()
);
`;
  }

  if (stack === "browser-app") {
    return `import {
  composeMiddlewares,
  createLoggerMiddleware,
  createRequestMetaMiddleware,
  createTimingMiddleware,
  withCacheControl,
  withRequestId,
  withSecurityHeaders
} from "${SERVER_PACKAGE}";

export default composeMiddlewares(
  withRequestId(),
  createRequestMetaMiddleware(),
  createTimingMiddleware(),
  withSecurityHeaders({
    contentSecurityPolicy: "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
  }),
  withCacheControl({
    value: "private, no-store"
  }),
  createLoggerMiddleware()
);
`;
  }

  return `import {
  composeMiddlewares,
  createLoggerMiddleware,
  createRequestMetaMiddleware,
  createTimingMiddleware
} from "${SERVER_PACKAGE}";

export default composeMiddlewares(
  createRequestMetaMiddleware(),
  createTimingMiddleware(),
  createLoggerMiddleware()
);
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
