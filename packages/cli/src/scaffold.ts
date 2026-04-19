import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { UI_COMPONENT_REGISTRY, type UiComponentRegistryKey } from "./ui-registry.js";

const LITOHO_VERSION = "^0.0.11";
const LITOHO_SCOPE = process.env.LITOHO_SCOPE?.trim() || "@litoho";
const LITOHO_CLI_PACKAGE = process.env.LITOHO_CLI_PACKAGE?.trim() || "litoho";
const LITOHO_CLI_BIN = process.env.LITOHO_CLI_BIN?.trim() || "litoho";

function scopedPackage(name: string) {
  return `${LITOHO_SCOPE}/${name}`;
}

const APP_PACKAGE = scopedPackage("app");
const SERVER_PACKAGE = scopedPackage("server");
const UI_PACKAGE = scopedPackage("ui");
const UI_SOURCE_DIRECTORY = new URL("../../ui/src/", import.meta.url);
const UI_COPY_HEADER_MARKER = "@litoho/ui-copy";

const UI_COMPONENT_MODULES = Object.fromEntries(
  Object.entries(UI_COMPONENT_REGISTRY).map(([name, metadata]) => [name, metadata.module])
) as Record<UiComponentRegistryKey, string>;

export type LuiComponentName = UiComponentRegistryKey;
export type AddUiComponentResult = {
  component: string;
  importPath: string;
  targetFile: string;
  copiedFiles: string[];
};
export type UiLocalFileStatus = "up_to_date" | "outdated" | "modified" | "diverged" | "legacy" | "missing" | "extra";
export type UiLocalFileReport = {
  file: string;
  sourceFile: string | null;
  status: UiLocalFileStatus;
};
export type UpgradeLocalUiComponentsResult = {
  created: string[];
  updated: string[];
  skipped: string[];
  unchanged: string[];
};

export type PageTemplate = "default" | "client-counter" | "server-data" | "api-inspector" | "not-found-demo";

export function createComponentFile(
  rootDir: string,
  componentPath: string,
  options: {
    tag?: string;
    page?: string;
    withUi?: string[];
  } = {}
) {
  const normalizedComponentPath = stripSlashes(componentPath).replace(/\.ts$/, "");

  if (normalizedComponentPath === "") {
    throw new Error("Component path is required.");
  }

  const targetFile = resolve(rootDir, "src/components", `${normalizedComponentPath}.ts`);
  ensureParentDirectory(targetFile);

  if (existsSync(targetFile)) {
    throw new Error(`Component already exists: ${targetFile}`);
  }

  const className = toIdentifier(titleCase(normalizedComponentPath)) || "AppComponent";
  const tagName = options.tag?.trim() || createComponentTagName(normalizedComponentPath);
  const pageFile = options.page ? resolve(rootDir, "app/pages", normalizePagePath(options.page)) : undefined;
  const componentTitle = titleCase(normalizedComponentPath) || "New Component";
  const uiComponents = (options.withUi ?? []).map(normalizeUiComponentName);
  const uiImportBlock =
    uiComponents.length > 0 ? `${uiComponents.map((name) => `import "${UI_PACKAGE}/${UI_COMPONENT_MODULES[name]}";`).join("\n")}\n` : "";

  writeFileSync(
    targetFile,
    `import { css, html } from "lit";
${uiImportBlock}import { LitoElement, defineComponent } from "${scopedPackage("core")}";

export class ${className} extends LitoElement {
  static properties = {
    title: { type: String }
  };

  static styles = css\`
    :host {
      display: block;
    }

    .component {
      padding: 1rem;
      border-radius: 1rem;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.72);
      color: #f8fafc;
    }

    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      line-height: 1.2;
    }

    p {
      margin: 0;
      color: #cbd5e1;
      line-height: 1.6;
    }
  \`;

  declare title: string;

  constructor() {
    super();
    this.title = "${componentTitle}";
  }

  render() {
    return html\`${createComponentRenderMarkup(uiComponents, escapeTemplateLiteral(targetFile))}\`;
  }
}

defineComponent("${tagName}", ${className});

declare global {
  interface HTMLElementTagNameMap {
    "${tagName}": ${className};
  }
}
`
  );

  if (uiComponents.length > 0) {
    ensureUiDependency(rootDir);
  }

  if (pageFile) {
    ensureComponentLinkedInPage(pageFile, targetFile, tagName, componentTitle);
  }

  return {
    targetFile,
    tagName,
    className,
    pageFile
  };
}

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
  mkdirSync(resolve(rootDir, "src/components"), { recursive: true });
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
            [UI_PACKAGE]: LITOHO_VERSION,
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

export function addUiComponentsToProject(
  rootDir: string,
  componentNames: string[],
  options: {
    file?: string;
    copy?: boolean;
    copyDir?: string;
  } = {}
) {
  const targetFile = resolve(rootDir, options.file ?? pickDefaultUiTarget(rootDir));
  const normalizedComponents = [...new Set(componentNames.map(normalizeUiComponentName))];

  if (normalizedComponents.length === 0) {
    throw new Error("At least one UI component is required.");
  }

  const copiedFiles = options.copy
    ? ensureLocalUiComponents(rootDir, normalizedComponents, options.copyDir ?? "app/components/ui")
    : [];

  if (!options.copy) {
    ensureUiDependency(rootDir);
  }

  const importPaths = normalizedComponents.map((componentName) =>
    options.copy
      ? toLocalUiImportPath(
          targetFile,
          resolve(rootDir, options.copyDir ?? "app/components/ui", `${UI_COMPONENT_MODULES[componentName]}.ts`)
        )
      : `${UI_PACKAGE}/${UI_COMPONENT_MODULES[componentName]}`
  );

  ensureImportsInFile(targetFile, importPaths);

  return normalizedComponents.map((component) => ({
    component,
    importPath: importPaths[normalizedComponents.indexOf(component)],
    targetFile,
    copiedFiles
  }));
}

export function diffLocalUiComponents(
  rootDir: string,
  componentNames: string[] = [],
  options: {
    copyDir?: string;
  } = {}
) {
  const copyDir = options.copyDir ?? "app/components/ui";
  const targetFiles = resolveUiLocalFileSet(rootDir, componentNames, copyDir);
  const reports: UiLocalFileReport[] = targetFiles.map(({ localFile, sourceFile }) => ({
    file: localFile,
    sourceFile: sourceFile.pathname,
    status: compareUiLocalFile(localFile, sourceFile)
  }));

  const extraFiles = findExtraUiLocalFiles(rootDir, copyDir, new Set(targetFiles.map((entry) => entry.localFile)));
  for (const extraFile of extraFiles) {
    reports.push({
      file: extraFile,
      sourceFile: null,
      status: "extra"
    });
  }

  return reports;
}

export function upgradeLocalUiComponents(
  rootDir: string,
  componentNames: string[] = [],
  options: {
    copyDir?: string;
    force?: boolean;
  } = {}
): UpgradeLocalUiComponentsResult {
  const copyDir = options.copyDir ?? "app/components/ui";
  const targetFiles = resolveUiLocalFileSet(rootDir, componentNames, copyDir);
  const result: UpgradeLocalUiComponentsResult = {
    created: [],
    updated: [],
    skipped: [],
    unchanged: []
  };

  for (const { localFile, sourceFile } of targetFiles) {
    const sourceContent = readFileSync(sourceFile, "utf8");
    const managedSourceContent = createManagedUiCopyContent(sourceFile.pathname, sourceContent);

    if (!existsSync(localFile)) {
      ensureParentDirectory(localFile);
      writeFileSync(localFile, managedSourceContent);
      result.created.push(localFile);
      continue;
    }

    const currentContent = readFileSync(localFile, "utf8");
    const currentStatus = compareUiLocalFile(localFile, sourceFile);

    if (currentStatus === "up_to_date") {
      result.unchanged.push(localFile);
      continue;
    }

    if (!options.force && currentStatus !== "outdated") {
      result.skipped.push(localFile);
      continue;
    }

    writeFileSync(localFile, managedSourceContent);
    result.updated.push(localFile);
  }

  return result;
}

function ensureParentDirectory(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function pickDefaultUiTarget(rootDir: string) {
  const rootLayoutPath = resolve(rootDir, "app/pages/_layout.ts");
  if (existsSync(rootLayoutPath)) {
    return "app/pages/_layout.ts";
  }

  const indexPagePath = resolve(rootDir, "app/pages/_index.ts");
  if (existsSync(indexPagePath)) {
    return "app/pages/_index.ts";
  }

  return "app/pages/_layout.ts";
}

function ensureUiDependency(rootDir: string) {
  const packageJsonPath = resolve(rootDir, "package.json");
  if (!existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
  };

  packageJson.dependencies ??= {};

  if (!packageJson.dependencies[UI_PACKAGE]) {
    packageJson.dependencies[UI_PACKAGE] = LITOHO_VERSION;
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }
}

function normalizeUiComponentName(componentName: string) {
  const normalizedComponentName = componentName.trim().toLowerCase() as LuiComponentName;

  if (!UI_COMPONENT_MODULES[normalizedComponentName]) {
    throw new Error(
      `Unknown UI component: ${componentName}. Supported components: ${Object.keys(UI_COMPONENT_MODULES).join(", ")}`
    );
  }

  return normalizedComponentName;
}

function ensureImportsInFile(targetFile: string, importPaths: string[]) {
  const uniqueImportStatements = [...new Set(importPaths)].map((importPath) => `import "${importPath}";`);

  if (!existsSync(targetFile)) {
    ensureParentDirectory(targetFile);
    writeFileSync(
      targetFile,
      `${uniqueImportStatements.join("\n")}
import type { LitoLayoutModule } from "${APP_PACKAGE}";

const layout: LitoLayoutModule = {
  render: ({ children }) => children
};

export default layout;
`
    );
    return;
  }

  const currentSource = readFileSync(targetFile, "utf8");
  const missingStatements = uniqueImportStatements.filter((statement) => !currentSource.includes(statement));

  if (missingStatements.length === 0) {
    return;
  }

  writeFileSync(targetFile, `${missingStatements.join("\n")}\n${currentSource}`);
}

function ensureComponentLinkedInPage(pageFile: string, componentFile: string, tagName: string, title: string) {
  if (!existsSync(pageFile)) {
    throw new Error(`Page does not exist: ${pageFile}`);
  }

  const importPath = toImportSpecifier(relative(dirname(pageFile), componentFile));
  ensureImportStatementsAfterDirectives(pageFile, [`import "${importPath}";`]);
  ensureComponentSnippetInPage(pageFile, tagName, title);
}

function ensureImportStatementsAfterDirectives(targetFile: string, statements: string[]) {
  const uniqueStatements = [...new Set(statements)];
  const currentSource = readFileSync(targetFile, "utf8");
  const missingStatements = uniqueStatements.filter((statement) => !currentSource.includes(statement));

  if (missingStatements.length === 0) {
    return;
  }

  const lines = currentSource.split("\n");
  let insertAt = 0;

  while (insertAt < lines.length && /^["']use (client|server)["'];$/.test(lines[insertAt].trim())) {
    insertAt += 1;
  }

  while (insertAt < lines.length && lines[insertAt].trim() === "") {
    insertAt += 1;
  }

  lines.splice(insertAt, 0, ...missingStatements, "");
  writeFileSync(targetFile, lines.join("\n"));
}

function ensureComponentSnippetInPage(pageFile: string, tagName: string, title: string) {
  const currentSource = readFileSync(pageFile, "utf8");

  if (currentSource.includes(`<${tagName}`)) {
    return;
  }

  const renderTemplateMarker = "html`";
  const renderTemplateIndex = currentSource.indexOf(renderTemplateMarker);

  if (renderTemplateIndex < 0) {
    throw new Error(`Could not inject component usage into page: ${pageFile}`);
  }

  const snippet = `
    <${tagName} title="${escapeHtmlAttribute(title)}">
      <p>Component scaffolded by Litoho in src/components.</p>
    </${tagName}>
    `;

  const insertAt = renderTemplateIndex + renderTemplateMarker.length;
  writeFileSync(pageFile, `${currentSource.slice(0, insertAt)}${snippet}${currentSource.slice(insertAt)}`);
}

function ensureLocalUiComponents(rootDir: string, componentNames: LuiComponentName[], copyDir: string) {
  const copiedFiles = new Set<string>();
  const fileSet = resolveUiLocalFileSet(rootDir, componentNames, copyDir);

  for (const { localFile, sourceFile } of fileSet) {
    const targetPath = localFile;

    ensureParentDirectory(targetPath);

    if (!existsSync(targetPath)) {
      writeFileSync(targetPath, createManagedUiCopyContent(sourceFile.pathname, readFileSync(sourceFile, "utf8")));
    }

    copiedFiles.add(targetPath);
  }

  return [...copiedFiles];
}

function toLocalUiImportPath(fromFilePath: string, toFilePath: string) {
  const relativePath = relative(dirname(fromFilePath), toFilePath).replace(/\\/g, "/").replace(/\.ts$/, ".js");
  return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
}

function resolveUiLocalFileSet(rootDir: string, componentNames: string[], copyDir: string) {
  const targetDirectory = resolve(rootDir, copyDir);
  const sourceModules = new Set<string>();
  const normalizedComponents =
    componentNames.length === 0 ? inferLocalUiComponents(rootDir, copyDir) : [...new Set(componentNames.map(normalizeUiComponentName))];

  for (const componentName of normalizedComponents) {
    sourceModules.add(UI_COMPONENT_MODULES[componentName]);
  }

  if (sourceModules.size > 0) {
    sourceModules.add("styles");
    sourceModules.add("define-element");
  }

  return [...sourceModules].map((sourceModule) => ({
    module: sourceModule,
    localFile: resolve(targetDirectory, `${sourceModule}.ts`),
    sourceFile: new URL(`${sourceModule}.ts`, UI_SOURCE_DIRECTORY)
  }));
}

function inferLocalUiComponents(rootDir: string, copyDir: string) {
  const targetDirectory = resolve(rootDir, copyDir);
  const inferred = new Set<LuiComponentName>();

  for (const [componentName, moduleName] of Object.entries(UI_COMPONENT_MODULES) as [LuiComponentName, string][]) {
    if (existsSync(resolve(targetDirectory, `${moduleName}.ts`))) {
      inferred.add(componentName);
    }
  }

  return [...inferred];
}

function compareUiLocalFile(localFile: string, sourceFile: URL): UiLocalFileStatus {
  if (!existsSync(localFile)) {
    return "missing";
  }

  const sourceContent = readFileSync(sourceFile, "utf8");
  const localContent = readFileSync(localFile, "utf8");
  const parsedCopy = parseManagedUiCopy(localContent);

  if (!parsedCopy) {
    return localContent === normalizeTrailingNewline(sourceContent) ? "legacy" : "diverged";
  }

  const currentSourceHash = hashContent(sourceContent);
  const localBodyHash = hashContent(parsedCopy.body);

  if (localBodyHash === currentSourceHash) {
    return "up_to_date";
  }

  if (localBodyHash === parsedCopy.sourceHash && parsedCopy.sourceHash !== currentSourceHash) {
    return "outdated";
  }

  if (parsedCopy.sourceHash === currentSourceHash) {
    return "modified";
  }

  return "diverged";
}

function findExtraUiLocalFiles(rootDir: string, copyDir: string, knownFiles: Set<string>) {
  const targetDirectory = resolve(rootDir, copyDir);
  if (!existsSync(targetDirectory)) {
    return [];
  }

  const expectedFileNames = new Set([
    ...Object.values(UI_COMPONENT_MODULES).map((moduleName) => `${moduleName}.ts`),
    "styles.ts",
    "define-element.ts"
  ]);

  return [...expectedFileNames]
    .map((fileName) => resolve(targetDirectory, fileName))
    .filter((filePath) => existsSync(filePath) && !knownFiles.has(filePath));
}

function createManagedUiCopyContent(sourceFilePath: string, sourceContent: string) {
  const normalizedSourceContent = normalizeTrailingNewline(sourceContent);
  const sourceHash = hashContent(normalizedSourceContent);

  return [
    `// ${UI_COPY_HEADER_MARKER}`,
    `// source: ${sourceFilePath}`,
    `// source-hash: ${sourceHash}`,
    `// litoho-version: ${LITOHO_VERSION}`,
    "",
    normalizedSourceContent
  ].join("\n");
}

function parseManagedUiCopy(content: string) {
  if (!content.startsWith(`// ${UI_COPY_HEADER_MARKER}`)) {
    return null;
  }

  const lines = content.split("\n");
  const separatorIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "");

  if (separatorIndex < 0) {
    return null;
  }

  const metadataLines = lines.slice(0, separatorIndex);
  const sourceHashLine = metadataLines.find((line) => line.startsWith("// source-hash: "));
  const sourceLine = metadataLines.find((line) => line.startsWith("// source: "));

  if (!sourceHashLine || !sourceLine) {
    return null;
  }

  return {
    source: sourceLine.slice("// source: ".length).trim(),
    sourceHash: sourceHashLine.slice("// source-hash: ".length).trim(),
    body: normalizeTrailingNewline(lines.slice(separatorIndex + 1).join("\n"))
  };
}

function hashContent(content: string) {
  return createHash("sha256").update(normalizeTrailingNewline(content)).digest("hex");
}

function normalizeTrailingNewline(content: string) {
  return content.endsWith("\n") ? content : `${content}\n`;
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

function toImportSpecifier(value: string) {
  const normalized = value.replace(/\\/g, "/");
  return normalized.startsWith(".") ? normalized : `./${normalized}`;
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
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

function createComponentTagName(componentPath: string) {
  const normalized = stripSlashes(componentPath)
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]+/g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase())
    .join("-");

  return normalized.startsWith("app-") ? normalized : `app-${normalized}`;
}

function createComponentRenderMarkup(uiComponents: LuiComponentName[], targetFile: string) {
  const componentNotice = `Edit ${targetFile} to build your Lit component.`;
  const hasCard = uiComponents.includes("card");
  const hasButton = uiComponents.includes("button");

  if (hasCard) {
    return `
      <lui-card class="component">
        <lui-card-header>
          <lui-card-title>\${this.title}</lui-card-title>
          <lui-card-description>${componentNotice}</lui-card-description>
        </lui-card-header>
        <lui-card-content>
          <div style="display: grid; gap: 0.75rem;">
            <slot></slot>
            ${hasButton ? `<lui-button>Primary action</lui-button>` : ""}
          </div>
        </lui-card-content>
      </lui-card>
    `;
  }

  if (hasButton) {
    return `
      <section class="component">
        <h2>\${this.title}</h2>
        <p>${componentNotice}</p>
        <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
          <lui-button>Primary action</lui-button>
          <slot></slot>
        </div>
      </section>
    `;
  }

  return `
      <section class="component">
        <h2>\${this.title}</h2>
        <p>${componentNotice}</p>
        <slot></slot>
      </section>
    `;
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
