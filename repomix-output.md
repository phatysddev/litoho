This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
docs/
  state.md
packages/
  app/
    src/
      client.ts
      hydration.ts
      index.ts
      modules.ts
      scanners.ts
    package.json
    tsconfig.json
    tsconfig.tsbuildinfo
  cli/
    src/
      doctor.ts
      generate-route-manifests.ts
      index.ts
      scaffold.ts
    package.json
    tsconfig.json
    tsconfig.tsbuildinfo
  core/
    src/
      events.ts
      index.ts
      lito-element.ts
      reactive-mixin.ts
      runtime.ts
      signals.ts
      store.ts
    package.json
    README.md
    tsconfig.json
    tsconfig.tsbuildinfo
  router/
    src/
      index.ts
      routes.ts
    package.json
    tsconfig.json
    tsconfig.tsbuildinfo
  server/
    src/
      client-assets.ts
      index.ts
      node-app.ts
      node-server.ts
      server.ts
    package.json
    tsconfig.json
    tsconfig.tsbuildinfo
  testing/
    src/
      index.ts
    tests/
      app-loader.test.mjs
      doctor.test.mjs
      manifest.test.mjs
      router.test.mjs
      server.test.mjs
      state.test.mjs
    package.json
    tsconfig.json
    tsconfig.tsbuildinfo
planning/
  PLANNING.md
playgrounds/
  demo-app/
    app/
      api/
        products/
          [id].ts
        users/
          [id]/
            [postId].ts
        health.ts
        products.ts
      pages/
        docs/
          getting-started/
            _index.ts
          _layout.ts
        orders/
          [id]/
            _index.ts
        products/
          [id]/
            edit/
              _index.ts
            _index.ts
          new/
            _index.ts
          _index.ts
        users/
          _index.ts
        _index.ts
        _layout.ts
    src/
      generated/
        .gitkeep
        api-manifest.ts
        page-manifest.ts
      main.ts
    index.html
    package.json
    server.ts
    tsconfig.json
    vite.config.ts
  demo-hydration/
    app/
      api/
        health.ts
      pages/
        csr-page/
          _index.ts
        ssr-page/
          _index.ts
        _index.ts
        _layout.ts
    src/
      generated/
        .gitkeep
        api-manifest.ts
        page-manifest.ts
      main.ts
    index.html
    package.json
    server.ts
    tsconfig.json
    vite.config.ts
  demo-state/
    app/
      api/
        catalog.ts
        health.ts
      pages/
        counter/
          _index.ts
        server-data/
          _index.ts
        store/
          _index.ts
        todos/
          _index.ts
        _index.ts
        _layout.ts
    src/
      generated/
        .gitkeep
        api-manifest.ts
        page-manifest.ts
      main.ts
    index.html
    package.json
    server.ts
    tsconfig.json
    vite.config.ts
.gitignore
package.json
pnpm-workspace.yaml
README.md
tsconfig.base.json
```

# Files

## File: docs/state.md
````markdown
# Lito State

Lito ships with a small reactive state layer designed to fit Lit and the rest of the framework runtime.

The current public API is:

- `signal(initialValue)` for writable state
- `memo(readFn)` for derived state
- `watch(fn)` for side effects
- `batch(fn)` for grouped updates
- `store(initialObject)` for object-shaped state
- `isClient` / `onClient()` for browser-only work
- `ReactiveMixin(Base)` for Lit integration
- `LitoElement` as the default base class for Lito components

## Philosophy

The state system is intentionally small:

- Reads happen through `.get()`
- Writes happen through `.set()` or `.update()`
- Dependencies are tracked automatically during `memo()`, `watch()`, and `LitoElement.render()`
- Multiple writes can be coalesced with `batch()`

This keeps the runtime predictable and easy to debug while still giving us automatic UI updates.

## `signal()`

Use `signal()` for the smallest unit of writable reactive state.

```ts
import { signal } from "@lito/core";

const count = signal(0);

count.get();
count.set(1);
count.update((value) => value + 1);
```

Available methods:

- `get()` reads the current value and tracks dependencies when inside reactive work
- `set(nextValue)` replaces the current value
- `update(updater)` derives the next value from the current one
- `subscribe(listener)` observes changes and returns an unsubscribe function

## `memo()`

Use `memo()` for derived values.

```ts
import { signal, memo } from "@lito/core";

const count = signal(2);
const doubled = memo(() => count.get() * 2);

doubled.get(); // 4
```

`memo()` is lazy:

- it computes on first read
- it re-computes when one of its dependencies changes
- it can itself be tracked by other `memo()`, `watch()`, or `LitoElement.render()` calls

## `watch()`

Use `watch()` for side effects such as logging, timers, subscriptions, or syncing to browser APIs.

```ts
import { signal, watch } from "@lito/core";

const user = signal("Lito");

const stop = watch(() => {
  console.log("Current user:", user.get());

  return () => {
    console.log("Cleanup before the next run or stop");
  };
});

stop();
```

Notes:

- `watch()` runs immediately once
- it re-runs when tracked dependencies change
- if your callback returns a function, that function is used as cleanup
- multiple synchronous writes are coalesced through microtasks
- use `watch(fn, { target: "client" })` when the effect should never run during SSR

```ts
import { signal, watch } from "@lito/core";

const count = signal(0);

watch(() => {
  console.log("Only in browser:", count.get());
}, { target: "client" });
```

## Browser-only helpers

Lito exposes lightweight runtime helpers for code that must stay out of SSR:

```ts
import { isClient, onClient } from "@lito/core";

if (isClient) {
  console.log("Running in the browser");
}

onClient(() => {
  console.log("Safe browser-only bootstrap");
});
```

## `batch()`

Use `batch()` to group several writes into a single notification wave.

```ts
import { signal, batch } from "@lito/core";

const first = signal("Lito");
const second = signal("Framework");

batch(() => {
  first.set("New");
  second.set("State");
});
```

This is useful when you want subscribers and `watch()` callbacks to observe the final state after a burst of writes.

## `store()`

Use `store()` when your state is naturally object-shaped.

```ts
import { store } from "@lito/core";

const profile = store({
  name: "Lito User",
  theme: "dark" as "dark" | "light",
  notifications: true
});

profile.get();
profile.get("name");
profile.set("theme", "light");
profile.set({ name: "Admin", notifications: false });
```

Available methods:

- `get()` returns a readonly snapshot
- `get("field")` returns a single field
- `set(partial)` applies a partial object update
- `set("field", value)` updates one field
- `subscribe(listener)` watches the whole object
- `subscribe("field", listener)` watches one field

## Lit integration

If you extend `LitoElement`, any `signal()`, `memo()`, or `store().get(...)` call inside `render()` is tracked automatically.

```ts
import { html } from "lit";
import { LitoElement, signal, memo } from "@lito/core";

const count = signal(0);
const doubled = memo(() => count.get() * 2);

class CounterCard extends LitoElement {
  protected override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <p>Count: ${count.get()}</p>
      <p>Doubled: ${doubled.get()}</p>
      <button @click=${() => count.update((value) => value + 1)}>Increment</button>
    `;
  }
}
```

If you need the behavior on a custom Lit base class, use `ReactiveMixin(Base)`.

## CSR-only pages

For pages that are mainly interactive state and do not need SSR HTML, set:

```ts
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  config: {
    ssr: false
  },
  render: () => {
    // client-only page shell
  }
};
```

When `config.ssr = false`:

- the server sends a client root placeholder instead of pre-rendered page HTML
- the client runtime loads the page module and mounts it in the browser
- interactive state and event wiring stay on the client side

## Choosing the right primitive

- Use `signal()` for simple values and lists
- Use `memo()` for derived state
- Use `watch()` for effects and integration with external systems
- Use `store()` for object-shaped app state
- Use `batch()` when several writes belong to one logical update

## Demo

The live reference app in this repo is `playgrounds/demo-state`.

Useful pages:

- `/counter` shows `signal()`, `memo()`, and `watch()`
- `/store` shows `store()` with object updates
- `/todos` shows a real UI built from `signal()` and `memo()`
````

## File: packages/app/src/client.ts
````typescript
import { LitElement } from "lit";
import type { LitoPageManifestEntry } from "./modules.js";
import { LITO_DATA_KEY } from "./hydration.js";

type TrackFn = <R>(fn: () => R) => {
  result: R;
  signals: Set<{ subscribe: (listener: (value: unknown) => void) => () => void }>;
};

export async function bootLitoClient(options: { pageManifest: LitoPageManifestEntry[] }) {
  console.info("Booting Lito client runtime...");
  
  const root = document.getElementById("lito-client-root");
  if (!root) {
    return;
  }

  const routeId = root.getAttribute("data-route-id");
  if (!routeId) {
    console.error("No data-route-id found on lito-client-root");
    return;
  }

  const manifestEntry = options.pageManifest.find((entry) => entry.routeId === routeId);
  if (!manifestEntry) {
    console.error(`No route found for routeId: ${routeId}`);
    return;
  }

  try {
    const pageResult = await manifestEntry.page() as any;
    const pageModule = pageResult.default;

    const windowData = (window as any)[LITO_DATA_KEY] || {};
    
    const context = {
        params: {},
        routeId: manifestEntry.routeId,
        url: new URL(window.location.href),
        locals: {}
    };

    let data = windowData.pageData;
    let actionData = windowData.actionData;

    // Optional: run pageModule.load() purely client-side if data is absent
    if (!data && pageModule.load) {
        data = await pageModule.load(context);
    }

    const track = (globalThis as typeof globalThis & { __LITO_TRACK__?: TrackFn }).__LITO_TRACK__;
    const elementTagName = `lito-client-page-${manifestEntry.routeId.replace(/[^a-z0-9-]+/gi, "-").toLowerCase()}`;

    if (!customElements.get(elementTagName)) {
      class LitoClientPageElement extends LitElement {
        private signalDisposers: Array<() => void> = [];
        private updatePending = false;

        protected override createRenderRoot() {
          return this;
        }

        override disconnectedCallback(): void {
          this.cleanupSignalSubscriptions();
          super.disconnectedCallback();
        }

        override render() {
          this.cleanupSignalSubscriptions();

          if (!track) {
            return pageModule.render({ ...context, data, actionData });
          }

          const { result: template, signals } = track(() => {
            return pageModule.render({ ...context, data, actionData });
          });

          for (const signal of signals) {
            const unsubscribe = signal.subscribe(() => {
              if (!this.updatePending) {
                this.updatePending = true;
                Promise.resolve().then(() => {
                  this.updatePending = false;
                  if (this.isConnected) {
                    this.requestUpdate();
                  }
                });
              }
            });
            this.signalDisposers.push(unsubscribe);
          }

          return template;
        }

        private cleanupSignalSubscriptions() {
          for (const dispose of this.signalDisposers) {
            dispose();
          }

          this.signalDisposers = [];
        }
      }

      customElements.define(elementTagName, LitoClientPageElement);
    }

    const host = document.createElement(elementTagName);
    root.replaceWith(host);

  } catch (error) {
    console.error("Failed to boot CSR page:", error);
  }
}
````

## File: packages/app/src/hydration.ts
````typescript
export const LITO_DATA_KEY = "__LITO_DATA__";

type ReadSsrDataOptions = {
  dataKey?: string;
  source?: Window;
};

type HydrateCustomElementOptions<Data> = {
  tagName: string;
  property?: string;
  host?: Element | null;
  hostSelector?: string;
  data?: Data;
};

type HydrateFromSsrDataOptions<Data> = {
  tagName: string;
  property?: string;
  host?: Element | null;
  hostSelector?: string;
  dataKey?: string;
  source?: Window;
  select?: (rawData: unknown) => Data | undefined;
};

export function readSsrData<Data = unknown>(options: ReadSsrDataOptions = {}): Data | undefined {
  const source = options.source ?? resolveWindow();

  if (!source) {
    return undefined;
  }

  const key = options.dataKey ?? LITO_DATA_KEY;
  const data = (source as Window & Record<string, unknown>)[key];

  return data as Data | undefined;
}

export function readPageData<PageData = unknown>(options: ReadSsrDataOptions = {}): PageData | undefined {
  const rawData = readSsrData<{ pageData?: PageData } | PageData>(options);

  if (!isObject(rawData)) {
    return rawData as PageData | undefined;
  }

  if ("pageData" in rawData) {
    return (rawData as { pageData?: PageData }).pageData;
  }

  return rawData as PageData;
}

export function hydrateCustomElement<Data>(options: HydrateCustomElementOptions<Data>): HTMLElement | null {
  const documentObject = resolveDocument();

  if (!documentObject) {
    return null;
  }

  const host = options.host ?? documentObject.querySelector(options.hostSelector ?? "#app");

  if (!host) {
    return null;
  }

  const element = documentObject.createElement(options.tagName) as HTMLElement & Record<string, unknown>;
  const property = options.property ?? "data";

  if (options.data !== undefined) {
    element[property] = options.data;
  }

  host.replaceChildren(element);
  return element;
}

export function hydrateFromSsrData<Data>(options: HydrateFromSsrDataOptions<Data>): HTMLElement | null {
  const rawData = readSsrData({
    dataKey: options.dataKey,
    source: options.source
  });
  const data = options.select ? options.select(rawData) : (rawData as Data | undefined);

  return hydrateCustomElement({
    tagName: options.tagName,
    property: options.property,
    host: options.host,
    hostSelector: options.hostSelector,
    data
  });
}

function resolveWindow() {
  return typeof window === "undefined" ? undefined : window;
}

function resolveDocument() {
  return typeof document === "undefined" ? undefined : document;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
````

## File: packages/app/src/index.ts
````typescript
export type {
  LitoAppErrorContext,
  LitoApiMiddlewareModule,
  LitoApiModule,
  LitoErrorModule,
  LitoLayoutDataMap,
  LitoLayoutModule,
  LitoNotFoundModule,
  LitoPageConfig,
  LitoPageContext,
  LitoPageManifestEntry,
  LitoPageModule
} from "./modules.js";
export { LITO_DATA_KEY, hydrateCustomElement, hydrateFromSsrData, readPageData, readSsrData } from "./hydration.js";
export {
  loadLitoAppFromManifest,
  scanApiMiddlewares,
  scanApiRoutesFromManifest,
  scanPageRoutesFromManifest,
  scanSpecialPageModules
} from "./scanners.js";
export { bootLitoClient } from "./client.js";
````

## File: packages/app/src/modules.ts
````typescript
import type {
  LitoApiRoute,
  LitoDocumentDefinition,
  LitoDocumentLinkTag,
  LitoErrorPage,
  LitoErrorPageContext,
  LitoMiddleware,
  LitoRequestContext,
  LitoNotFoundPage,
  LitoCacheConfig
} from "@lito/server";

export type LitoLayoutDataMap = Record<string, unknown>;

export type LitoPageContext<Data = unknown, ActionData = unknown> = LitoRequestContext & {
  data: Data;
  actionData?: ActionData;
  layoutData: LitoLayoutDataMap;
};

export type LitoPageConfig = {
  ssr?: boolean;
};

export type LitoPageModule<Data = unknown, ActionData = unknown> = {
  config?: LitoPageConfig;
  cache?: LitoCacheConfig;
  action?: (context: Omit<LitoPageContext<never, never>, "data" | "actionData">) => ActionData | Promise<ActionData>;
  load?: (context: Omit<LitoPageContext<never, never>, "data" | "actionData">) => Data | Promise<Data>;
  document?:
    | LitoDocumentDefinition
    | ((context: LitoPageContext<Data, ActionData>) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>);
  render: (context: LitoPageContext<Data, ActionData>) => unknown;
};

export type LitoLayoutModule<Data = unknown> = {
  load?: (context: Omit<LitoRequestContext, "timing"> & { timing: LitoRequestContext["timing"]; layoutData: LitoLayoutDataMap }) => Data | Promise<Data>;
  document?:
    | LitoDocumentDefinition
    | ((context: Omit<LitoRequestContext, "timing"> & {
        timing: LitoRequestContext["timing"];
        data: Data;
        layoutData: LitoLayoutDataMap;
      }) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>);
  render: (context: Omit<LitoRequestContext, "timing"> & {
    timing: LitoRequestContext["timing"];
    data: Data;
    layoutData: LitoLayoutDataMap;
    children: unknown;
  }) => unknown;
};

export type LitoApiModule = Omit<LitoApiRoute, "id" | "path">;

export type LitoApiMiddlewareModule = LitoMiddleware | readonly LitoMiddleware[];

export type LitoNotFoundModule = LitoNotFoundPage;

export type LitoErrorModule = LitoErrorPage;

export type LitoAppErrorContext = LitoErrorPageContext;

export type LitoLayoutManifestEntry = {
  key: string;
  loader: () => Promise<unknown>;
};

export type LitoPageManifestEntry = {
  layouts: readonly LitoLayoutManifestEntry[];
  page: () => Promise<unknown>;
  routeId: string;
  routePath: string;
  mode?: "client" | "server";
};
````

## File: packages/app/src/scanners.ts
````typescript
import type {
  LitoApiRoute,
  LitoDocumentDefinition,
  LitoErrorPage,
  LitoMiddleware,
  LitoNotFoundPage,
  LitoPageRoute
} from "@lito/server";
import type {
  LitoApiMiddlewareModule,
  LitoApiModule,
  LitoErrorModule,
  LitoLayoutDataMap,
  LitoLayoutModule,
  LitoNotFoundModule,
  LitoPageManifestEntry,
  LitoPageModule
} from "./modules.js";

export async function scanPageRoutesFromManifest(options: {
  manifestBaseUrl: URL;
  pageManifest: readonly LitoPageManifestEntry[];
}): Promise<LitoPageRoute[]> {
  const routes = await Promise.all(
    options.pageManifest.map(async (entry) => {
      const pageResult = await entry.page();
      const pageModule = (pageResult as any).default as LitoPageModule;
      const layouts = await Promise.all(
        entry.layouts.map(async (layout) => {
          const layoutResult = await layout.loader();
          return {
            key: layout.key,
            module: ((layoutResult as any).default as LitoLayoutModule) ?? null
          };
        })
      );

      return {
        id: entry.routeId,
        path: entry.routePath,
        mode: pageModule.config?.ssr === false ? "client" : entry.mode,
        cache: pageModule.cache,
        action: pageModule.action ? async (context: any) => pageModule.action!(context) : undefined,
        load: async (context) => {
          const layoutData: LitoLayoutDataMap = {};

          for (const layout of layouts) {
            if (!layout.module?.load) continue;
            layoutData[layout.key] = await layout.module.load({ ...context, layoutData });
          }

          const pageData = pageModule.load ? await pageModule.load({ ...context, layoutData }) : undefined;

          return { layoutData, pageData };
        },
        document: async (context) => {
          const loadedData = normalizeLoadedData(context.data);
          const layoutDocuments = await Promise.all(
            layouts.map((layout) =>
              resolveDocument(layout.module?.document, {
                ...context,
                data: loadedData.layoutData[layout.key],
                layoutData: loadedData.layoutData
              })
            )
          );
          const pageDocument = await resolveDocument(pageModule.document, {
            ...context,
            data: loadedData.pageData,
            layoutData: loadedData.layoutData
          });

          return mergeDocuments([...layoutDocuments, pageDocument]);
        },
        render: (context) => {
          const loadedData = normalizeLoadedData(context.data);
          const pageContent = pageModule.render({
            ...context,
            data: loadedData.pageData,
            layoutData: loadedData.layoutData
          });

          return layouts.reduceRight((children, layout) => {
            if (!layout.module) return children;
            return layout.module.render({
              ...context,
              data: loadedData.layoutData[layout.key],
              layoutData: loadedData.layoutData,
              children
            });
          }, pageContent);
        }
      } satisfies LitoPageRoute;
    })
  );

  return routes.sort((left: LitoPageRoute, right: LitoPageRoute) => left.path.localeCompare(right.path));
}

export async function scanApiRoutesFromManifest(options: {
  manifestBaseUrl: URL;
  apiModulePaths: readonly string[];
}): Promise<LitoApiRoute[]> {
  const routes = await Promise.all(
    options.apiModulePaths.map(async (modulePath) => {
      const loadedModule = await import(/* @vite-ignore */ new URL(modulePath, options.manifestBaseUrl).href);
      const apiModule = resolveApiModule(loadedModule as LitoApiModule & { default?: LitoApiModule });
      const normalizedRelativePath = modulePath.replace(/^(\.\.\/)+app\/api\//, "");

      return {
        id: createRouteId(normalizedRelativePath),
        path: createRoutePath(normalizedRelativePath, "/api"),
        get: apiModule.get,
        post: apiModule.post,
        put: apiModule.put,
        patch: apiModule.patch,
        delete: apiModule.delete,
        options: apiModule.options
      } satisfies LitoApiRoute;
    })
  );

  return routes.sort((left: LitoApiRoute, right: LitoApiRoute) => left.path.localeCompare(right.path));
}

function resolveApiModule(moduleExports: LitoApiModule & { default?: LitoApiModule }) {
  if (moduleExports.default) {
    return moduleExports.default;
  }

  return moduleExports;
}

export async function scanSpecialPageModules(options: {
  manifestBaseUrl: URL;
  notFoundPagePath?: string;
  errorPagePath?: string;
}): Promise<{
  errorPage?: LitoErrorPage;
  notFoundPage?: LitoNotFoundPage;
}> {
  return {
    notFoundPage: await loadOptionalSpecialPageModule<LitoNotFoundModule>(options.manifestBaseUrl, options.notFoundPagePath),
    errorPage: await loadOptionalSpecialPageModule<LitoErrorModule>(options.manifestBaseUrl, options.errorPagePath)
  };
}

export async function scanApiMiddlewares(options: {
  manifestBaseUrl: URL;
  middlewareModulePath?: string;
}): Promise<LitoMiddleware[]> {
  const loadedModule = await loadOptionalSpecialPageModule<LitoApiMiddlewareModule>(
    options.manifestBaseUrl,
    options.middlewareModulePath
  );

  if (!loadedModule) {
    return [];
  }

  if (Array.isArray(loadedModule)) {
    return [...loadedModule] as LitoMiddleware[];
  }

  return [loadedModule as LitoMiddleware];
}

export async function loadLitoAppFromManifest(options: {
  manifestBaseUrl: URL;
  pageManifest: readonly LitoPageManifestEntry[];
  apiModulePaths: readonly string[];
  notFoundPagePath?: string;
  errorPagePath?: string;
  apiMiddlewarePath?: string;
}) {
  const [pages, apiRoutes, specialPages, middlewares] = await Promise.all([
    scanPageRoutesFromManifest({
      manifestBaseUrl: options.manifestBaseUrl,
      pageManifest: options.pageManifest
    }),
    scanApiRoutesFromManifest({
      manifestBaseUrl: options.manifestBaseUrl,
      apiModulePaths: options.apiModulePaths
    }),
    scanSpecialPageModules({
      manifestBaseUrl: options.manifestBaseUrl,
      notFoundPagePath: options.notFoundPagePath ?? "../../app/pages/_not-found.ts",
      errorPagePath: options.errorPagePath ?? "../../app/pages/_error.ts"
    }),
    scanApiMiddlewares({
      manifestBaseUrl: options.manifestBaseUrl,
      middlewareModulePath: options.apiMiddlewarePath ?? "../../app/api/_middleware.ts"
    })
  ]);

  return {
    pages,
    apiRoutes,
    middlewares,
    ...specialPages
  };
}

async function resolveDocument<ContextType>(
  document:
    | LitoDocumentDefinition
    | ((context: ContextType) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>)
    | undefined,
  context: ContextType
) {
  if (!document) return undefined;
  return typeof document === "function" ? await document(context) : document;
}

function mergeDocuments(documents: Array<LitoDocumentDefinition | undefined>): LitoDocumentDefinition {
  return documents.reduce<LitoDocumentDefinition>(
    (accumulator, document) => {
      if (!document) return accumulator;
      return {
        title: document.title ?? accumulator.title,
        lang: document.lang ?? accumulator.lang,
        meta: [...(accumulator.meta ?? []), ...(document.meta ?? [])],
        styles: [...(accumulator.styles ?? []), ...(document.styles ?? [])]
      };
    },
    { meta: [], styles: [] }
  );
}

function createLayoutKey(normalizedLayoutPath: string) {
  const layoutDirectory = normalizedLayoutPath.replace(/\/?_layout\.ts$/, "");
  return layoutDirectory === "" ? "root" : layoutDirectory.replace(/\//g, ".");
}

function normalizeLoadedData(data: unknown): { layoutData: LitoLayoutDataMap; pageData: unknown } {
  const candidate = data as { layoutData?: LitoLayoutDataMap; pageData?: unknown } | undefined;
  return {
    layoutData: candidate?.layoutData ?? {},
    pageData: candidate?.pageData
  };
}

function createRouteId(relativePath: string) {
  const segments = normalizeIndexSegments(stripExtension(relativePath));
  return segments.length === 0 ? "index" : segments.join(":");
}

function createRoutePath(relativePath: string, prefix = "") {
  const normalized = normalizeIndexSegments(stripExtension(relativePath));
  const segments = normalized.flatMap((segment) => {
    if (/^\[.+\]$/.test(segment)) return `:${segment.slice(1, -1)}`;
    return segment;
  });
  const pathname = segments.length === 0 ? "/" : `/${segments.join("/")}`;
  if (!prefix) return pathname;
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function stripExtension(pathname: string) {
  return pathname.replace(/\.ts$/, "");
}

function normalizeIndexSegments(pathname: string) {
  return pathname
    .split("/")
    .flatMap((segment) => {
      if (segment === "_index") return [];
      return segment;
    });
}

async function loadOptionalSpecialPageModule<ModuleType>(
  manifestBaseUrl: URL,
  modulePath: string | undefined
): Promise<ModuleType | undefined> {
  if (!modulePath) return undefined;

  try {
    const resolvedUrl = new URL(modulePath, manifestBaseUrl);
    return (await import(/* @vite-ignore */ resolvedUrl.href)).default as ModuleType;
  } catch (error) {
    if (isModuleNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

function isModuleNotFoundError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & { code?: string; message: string };
  return candidate.code === "ERR_MODULE_NOT_FOUND" || candidate.message.includes("Cannot find module");
}
````

## File: packages/app/package.json
````json
{
  "name": "@lito/app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@lito/server": "workspace:*",
    "lit": "^3.0.0"
  }
}
````

## File: packages/app/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/app/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/css-tag.d.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/reactive-controller.d.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/reactive-element.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/directive.d.ts","../../node_modules/.pnpm/@types+trusted-types@2.0.7/node_modules/@types/trusted-types/lib/index.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/lit-html.d.ts","../../node_modules/.pnpm/lit-element@4.2.2/node_modules/lit-element/development/lit-element.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/is-server.d.ts","../../node_modules/.pnpm/lit@3.3.2/node_modules/lit/development/index.d.ts","../server/dist/client-assets.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts","../../node_modules/.pnpm/@types+estree@1.0.8/node_modules/@types/estree/index.d.ts","../../node_modules/.pnpm/rollup@4.60.1/node_modules/rollup/dist/rollup.d.ts","../../node_modules/.pnpm/rollup@4.60.1/node_modules/rollup/dist/parseast.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/hmrpayload.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/customevent.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/hot.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/types.d-agj9qkwt.d.ts","../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.d.ts","../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/source-map.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/previous-map.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/input.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/css-syntax-error.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/declaration.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/root.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/warning.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/lazy-result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/no-work-result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/processor.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/document.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/rule.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/node.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/comment.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/container.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/at-rule.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/list.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/postcss.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/postcss.d.mts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/runtime.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/importglob.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/metadata.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/index.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/request/constants.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/router.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/headers.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/http-status.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/body.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/request.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/mime.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/context.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/hono-base.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/hono.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/client.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/fetch-result-please.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/utils.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/index.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/index.d.ts","../server/dist/server.d.ts","../server/dist/node-app.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/types.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/server.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/listener.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/request.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/index.d.ts","../server/dist/node-server.d.ts","../server/dist/index.d.ts","./src/modules.ts","./src/hydration.ts","./src/client.ts","./src/scanners.ts","./src/index.ts"],"fileIdsList":[[75,123,137,138,139,140,141,143,226,227,228,229],[75,123,137,138,139,140,141,226],[75,123,137,138,140,141],[75,123,137,138,139,140,141,143,226],[75,123,137,138,139,140,141],[75,123,140,141],[60,61,75,123,140,141],[75,120,121,123,140,141],[75,122,123,140,141],[123,140,141],[75,123,128,140,141,158],[75,123,124,129,134,140,141,143,155,166],[75,123,124,125,134,140,141,143],[70,71,72,75,123,140,141],[75,123,126,140,141,167],[75,123,127,128,135,140,141,144],[75,123,128,140,141,155,163],[75,123,129,131,134,140,141,143],[75,122,123,130,140,141],[75,123,131,132,140,141],[75,123,133,134,140,141],[75,122,123,134,140,141],[75,123,134,135,136,140,141,155,166],[75,123,134,135,136,140,141,150,155,158],[75,116,123,131,134,137,140,141,143,155,166],[75,123,134,135,137,138,140,141,143,155,163,166],[75,123,137,139,140,141,155,163,166],[73,74,75,76,77,78,79,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172],[75,123,134,140,141],[75,123,140,141,142,166],[75,123,131,134,140,141,143,155],[75,123,140,141,144],[75,123,140,141,145],[75,122,123,140,141,146],[75,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172],[75,123,140,141,148],[75,123,140,141,149],[75,123,134,140,141,150,151],[75,123,140,141,150,152,167,169],[75,123,135,140,141],[75,123,134,140,141,155,156,158],[75,123,140,141,157,158],[75,123,140,141,155,156],[75,123,140,141,158],[75,123,140,141,159],[75,120,123,140,141,155,160,166],[75,123,134,140,141,161,162],[75,123,140,141,161,162],[75,123,128,140,141,143,155,163],[75,123,140,141,164],[75,123,140,141,143,165],[75,123,137,140,141,149,166],[75,123,128,140,141,167],[75,123,140,141,155,168],[75,123,140,141,142,169],[75,123,140,141,170],[75,116,123,140,141],[75,116,123,134,136,140,141,146,155,158,166,168,169,171],[75,123,140,141,155,172],[75,123,140,141,210,217,218],[75,123,140,141,218,219,221],[75,123,140,141,207,209,210,211,216,217],[75,123,140,141,209,218,220],[75,123,140,141,207,208,209,210,211,213,214],[75,123,140,141,207,211,215],[75,123,140,141,211,216],[75,123,140,141,211,213,215,217,222],[75,123,140,141,206,207,208,210,211,212],[75,123,140,141,208,209,210,215,216],[75,123,140,141,213],[62,65,75,123,140,141],[65,75,123,140,141],[63,64,75,123,140,141],[62,65,66,67,75,123,140,141],[75,123,140,141,197],[75,123,140,141,195,197],[75,123,140,141,186,194,195,196,198,200],[75,123,140,141,184],[75,123,140,141,187,192,197,200],[75,123,140,141,183,200],[75,123,140,141,187,188,191,192,193,200],[75,123,140,141,187,188,189,191,192,200],[75,123,140,141,184,185,186,187,188,192,193,194,196,197,198,200],[75,123,140,141,200],[75,123,140,141,182,184,185,186,187,188,189,191,192,193,194,195,196,197,198,199],[75,123,140,141,182,200],[75,123,140,141,187,189,190,192,193,200],[75,123,140,141,191,200],[75,123,140,141,192,193,197,200],[75,123,140,141,185,195],[75,123,140,141,175,204],[75,123,140,141,174,175],[75,88,92,123,140,141,166],[75,88,123,140,141,155,166],[75,83,123,140,141],[75,85,88,123,140,141,163,166],[75,123,140,141,143,163],[75,123,140,141,173],[75,83,123,140,141,173],[75,85,88,123,140,141,143,166],[75,80,81,84,87,123,134,140,141,155,166],[75,88,95,123,140,141],[75,80,86,123,140,141],[75,88,109,110,123,140,141],[75,84,88,123,140,141,158,166,173],[75,109,123,140,141,173],[75,82,83,123,140,141,173],[75,88,123,140,141],[75,82,83,84,85,86,87,88,89,90,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,110,111,112,113,114,115,123,140,141],[75,88,103,123,140,141],[75,88,95,96,123,140,141],[75,86,88,96,97,123,140,141],[75,87,123,140,141],[75,80,83,88,123,140,141],[75,88,92,96,97,123,140,141],[75,92,123,140,141],[75,86,88,91,123,140,141,166],[75,80,85,88,95,123,140,141],[75,123,140,141,155],[75,83,88,109,123,140,141,171,173],[75,123,134,135,137,138,139,140,141,143,155,163,166,172,173,175,176,177,178,179,180,181,201,202,203,204],[75,123,140,141,177,178,179,180],[75,123,140,141,177,178,179],[75,123,140,141,177],[75,123,140,141,178],[75,123,140,141,175],[68,75,123,140,141,233,234],[75,123,140,141,233,234,235,236],[75,123,140,141,232],[75,123,140,141,232,233],[69,75,123,140,141,224,225,231],[75,123,137,140,141,205,224],[75,123,140,141,230],[69,75,123,140,141,211,223]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"74012d464fbc5354ca3a7d5e71bee43b17da01a853c8ff10971bbe3680c76f40","impliedFormat":99},{"version":"5e30131b6a5587fe666926ad1d9807e733c0a597ed12d682669fcaa331aea576","impliedFormat":99},{"version":"a0f82d2f9450bd147a8c137798d9501bd49b7c9e118f75b07b76709ff39b6b55","affectsGlobalScope":true,"impliedFormat":99},{"version":"00cb63103f9670f8094c238a4a7e252c8b4c06ba371fea5c44add7e41b7247e4","impliedFormat":99},{"version":"15fe687c59d62741b4494d5e623d497d55eb38966ecf5bea7f36e48fc3fbe15e","impliedFormat":1},{"version":"e09db3291e6b440f7debed2227d8357e80c95987a0d0d67ac17521d8f7b11bdb","impliedFormat":99},{"version":"9a318e3a8900672b85cd3c8c3a5acf51b88049557a3ae897ccdcf2b85a8f61f9","impliedFormat":99},{"version":"1bcd560deed90a43c51b08aa18f7f55229f2e30974ab5ed1b7bb5721be379013","impliedFormat":99},{"version":"dc08fe04e50bc24d1baded4f33e942222bbdd5d77d6341a93cfe6e4e4586a3be","impliedFormat":99},"2aa8d0bb5c3019d6f8f2855a7a236f30dc2077994c729656fd3d4cda3f5708c0",{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1},{"version":"151ff381ef9ff8da2da9b9663ebf657eac35c4c9a19183420c05728f31a6761d","impliedFormat":1},{"version":"ee70b8037ecdf0de6c04f35277f253663a536d7e38f1539d270e4e916d225a3f","affectsGlobalScope":true,"impliedFormat":1},{"version":"a660aa95476042d3fdcc1343cf6bb8fdf24772d31712b1db321c5a4dcc325434","impliedFormat":1},{"version":"282f98006ed7fa9bb2cd9bdbe2524595cfc4bcd58a0bb3232e4519f2138df811","impliedFormat":1},{"version":"6222e987b58abfe92597e1273ad7233626285bc2d78409d4a7b113d81a83496b","impliedFormat":1},{"version":"cbe726263ae9a7bf32352380f7e8ab66ee25b3457137e316929269c19e18a2be","impliedFormat":1},{"version":"8b96046bf5fb0a815cba6b0880d9f97b7f3a93cf187e8dcfe8e2792e97f38f87","impliedFormat":99},{"version":"bacf2c84cf448b2cd02c717ad46c3d7fd530e0c91282888c923ad64810a4d511","affectsGlobalScope":true,"impliedFormat":1},{"version":"402e5c534fb2b85fa771170595db3ac0dd532112c8fa44fc23f233bc6967488b","impliedFormat":1},{"version":"52dcc257df5119fb66d864625112ce5033ac51a4c2afe376a0b299d2f7f76e4a","impliedFormat":1},{"version":"e5bab5f871ef708d52d47b3e5d0aa72a08ee7a152f33931d9a60809711a2a9a3","impliedFormat":1},{"version":"e16dc2a81595736024a206c7d5c8a39bfe2e6039208ef29981d0d95434ba8fcf","impliedFormat":1},{"version":"cc4a4903fb698ca1d961d4c10dce658aa3a479faf40509d526f122b044eaf6a4","impliedFormat":1},{"version":"19ee8416e6473ed6c7adb868fa796b5653cf0fa2a337658e677eaa0d134388c3","impliedFormat":1},{"version":"1328ab4e442614b28cdb3d4b414cf68325c0da0dca07287a338d0654b7a00261","impliedFormat":1},{"version":"a039dc21f045919f3cbee2ec13812cc6cc3eebc99dae4be00973230f468d19a6","impliedFormat":1},{"version":"3fbe57af01460e49dcd29df55d6931e1672bc6f1be0fb073d11410bc16f9037d","impliedFormat":1},{"version":"f760be449e8562ec5c09bb5187e8e1eabf3c113c0c58cddda53ef8c69f3e2131","impliedFormat":1},{"version":"44325ed13294fce6ab825b82947bbeed2611db7dad9d9135260192f375e5a189","impliedFormat":1},{"version":"e392e8fb5b514eafc585601c1d781485aa6dd6a320e75daf1064a4c6918a1b45","impliedFormat":1},{"version":"46e4a36e8ddbdfb4e7330e11c81c970dc8b218611df9183d39c41c5f8c653b55","impliedFormat":1},{"version":"370bde134aa8c2abc926d0e99d3a4d5d5dba65c6ee65459137e4f02670cbf841","impliedFormat":1},{"version":"6332f565867cf4a740a70e30f31cefba37ef7cebcf74f22eab8d744fde6d193e","impliedFormat":1},{"version":"2977b7884aedc895a1d0c9c210c7cf3272c29d6959a08a6fa3ff71e0aff08175","impliedFormat":1},{"version":"17f2922d41ddd032830a91371c948cd9ce903b35c95adca72271a54584f19b0b","impliedFormat":1},{"version":"3eed76ede2a1a14d7c9bb0a642041282dcc264811139d3dd275c9fe14efc9840","impliedFormat":1},{"version":"00cf4001e0d9c6e5e036bc545b9d73e2b8b84cddb02e61ad05bab3752b1d4522","impliedFormat":1},{"version":"8d369483f0c2b9ee388129cfdb6a43bc8112b377e86a41884bd06e19ce04f4c1","impliedFormat":99},{"version":"82e687ebd99518bc63ea04b0c3810fb6e50aa6942decd0ca6f7a56d9b9a212a6","impliedFormat":99},{"version":"7f698624bbbb060ece7c0e51b7236520ebada74b747d7523c7df376453ed6fea","impliedFormat":1},{"version":"8f07f2b6514744ac96e51d7cb8518c0f4de319471237ea10cf688b8d0e9d0225","impliedFormat":1},{"version":"257b83faa134d971c738a6b9e4c47e59bb7b23274719d92197580dd662bfafc3","impliedFormat":99},{"version":"a8cc184ee589bd3806e9e2c5b113f66c5953a20502775adabbce54ec30de8052","impliedFormat":1},{"version":"a033992e14caa339d5b5ba48061035be198e008296b95bc3f0cdaa5c02a845c8","impliedFormat":1},{"version":"b9c8c2b3e7b665f0d8f07c46e4ee4ef586f4fa6e2a9b7e05b453737d7e144d3e","impliedFormat":1},{"version":"984c26e8864dc326bf6f7a72f89625b3facd86a901d406b7e54aca3d6ef9d674","impliedFormat":1},{"version":"9065f8bfa4e2bbbb38964d8f93a052965e432beb813c444db26a6494434482aa","impliedFormat":1},{"version":"ca6e767165251f4ec3fed240d95ebf19564a9ca99974adde254c9f73fc25d2bf","impliedFormat":1},{"version":"5c9b631fd684665b7ab77aadfae34060a03e049bf2b39166a4e3878a2fe978dc","impliedFormat":1},{"version":"4f8ab5f636fe50dee05fdaed4f4d7a68458edcaf65bc7c7e0764710a9738d435","impliedFormat":1},{"version":"304797c1a60c5f9d85cc55c1b21cdf6d327957cd61191dfc60357b4227b2a94b","impliedFormat":1},{"version":"1ab578c2a429a3c9cc09da99161712aca9730b56452bcf9d7d95c434a9ff2cc9","impliedFormat":1},{"version":"a9382cc4fe0533a57a86e32684d916899528dac08c03bae387a7afacde76cd4a","impliedFormat":1},{"version":"45dd008396b925f1d22bd7c9adbacce9cf66a929ddd4ffb80dc936863bffe103","impliedFormat":1},{"version":"2c01a3ba2a23b8a3a85e12de6e1c7347dfb6554da9e30b49bbb125f6fd217462","impliedFormat":1},{"version":"f19e3abbf04cb89295686f97190766a0b21d1a8191b86e52c63765cfd09b19ca","impliedFormat":1},{"version":"f5bfda545fc03ca1b3dae2cf4c44d06e74bc9865a6a038272ecc4de91dc78685","impliedFormat":1},{"version":"4f6a71f795afdbc9389eb2c8d7ea9f228d95b0d70dfff00a2cf357aecb26f394","impliedFormat":1},{"version":"a01c34217ba822ccd2dd0040822c1f615eeee8ea957efdcb62526152024d9dc6","impliedFormat":1},{"version":"38bf0f2ce09fcf3eba1db11181696a3ffc32a795974d67cef41ff756e08a5c2e","impliedFormat":1},"46a759c2063ec5f15db2bd8bb81f595db0df8d7b6cb4856b62a8f053e27a7fbb","b304ba51159423710c71800c5f37488b50ba38a9234f7da82f63bff311b09a6c",{"version":"77ce0e4b752d448462724acefb13f0b0a9b132b507e3eeb7466276190e708d04","impliedFormat":1},{"version":"e00dbc9d2c4dba5e071dc5e6ef53d119dcc80ab6865a07cbf6ba180571092778","impliedFormat":1},{"version":"596bc47c8cad767619763941150e1c08c4a863950f07bcc0ff3c16ea60a6e730","impliedFormat":1},{"version":"304115b5c6200938be92e5daf0cb1b59468e47ca558184cc0c900aa8294e7f55","impliedFormat":1},{"version":"039ded2c755746d4d93c865d26222f8279a9e836ccefc258ba3ab73b810322a6","impliedFormat":1},"99a966edea4ae9c39058b2a855672abb75acbb5ae8ccbc4fdfa15f5973062c1f","dc4116818e8eb610af135323f95002b32ef244b2886265a95a0d5293adf255d3",{"version":"60191d57d85e63f8258d391547b61eb4475bca1480b51bf4b98b6a93a54ce19a","signature":"a0a3c10c4a303e4bc89a2869c7a357b3e3e747188ddd542efa9ddd78b972420c"},{"version":"b10cf6437ffac8628dbf94c57d7d61086e1eb97f1f3d0be44036fcb7c2862bd3","signature":"e97c6d72c24f461de71dd99da3a4340924943319d00dcdce32c04f9bc97142f2"},{"version":"1d83503f44e6d610df0683b3ad733a82408a86ad4c40ffc27c01417602c7914a","signature":"3d18370924b78c094ea4e4fb8b90e180cde83f6bc3e11ef794a39b34723a2e03"},{"version":"9a67338c4df35478dd21f55eb59aa1ed9b7a0164f578450cdc60aa8daf037c26","signature":"53a55436bc11c659319e7a73ac952a8319ccc720afe610c8a983728d8b69c859"},{"version":"529ec16936bde31c6303181f1216c9fa9006cc6cc463eb6f4722939a30a7e0bb","signature":"68db3c1d7fdc29626197fe6d78621926a94c12c524d4c3cae9da79749faf44ec"}],"root":[[233,237]],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[230,1],[228,2],[229,3],[227,4],[226,5],[60,6],[61,6],[62,7],[174,6],[120,8],[121,8],[122,9],[75,10],[123,11],[124,12],[125,13],[70,6],[73,14],[71,6],[72,6],[126,15],[127,16],[128,17],[129,18],[130,19],[131,20],[132,20],[133,21],[134,22],[135,23],[136,24],[76,6],[74,6],[137,25],[138,26],[139,27],[173,28],[140,29],[141,6],[142,30],[143,31],[144,32],[145,33],[146,34],[147,35],[148,36],[149,37],[150,38],[151,38],[152,39],[153,6],[154,40],[155,41],[157,42],[156,43],[158,44],[159,45],[160,46],[161,47],[162,48],[163,49],[164,50],[165,51],[166,52],[167,53],[168,54],[169,55],[170,56],[77,6],[78,6],[79,6],[117,57],[118,6],[119,6],[171,58],[172,59],[64,6],[181,6],[219,60],[220,6],[222,61],[218,62],[221,63],[215,64],[216,65],[217,66],[223,67],[213,68],[206,6],[207,6],[211,69],[212,70],[208,6],[209,6],[214,6],[210,6],[66,71],[63,72],[67,6],[65,73],[68,74],[198,75],[196,76],[197,77],[185,78],[186,76],[193,79],[184,80],[189,81],[199,6],[190,82],[195,83],[201,84],[200,85],[183,86],[191,87],[192,88],[187,89],[194,75],[188,90],[176,91],[175,92],[182,6],[58,6],[59,6],[10,6],[11,6],[13,6],[12,6],[2,6],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[20,6],[21,6],[3,6],[22,6],[23,6],[4,6],[24,6],[28,6],[25,6],[26,6],[27,6],[29,6],[30,6],[31,6],[5,6],[32,6],[33,6],[34,6],[35,6],[6,6],[39,6],[36,6],[37,6],[38,6],[40,6],[7,6],[41,6],[46,6],[47,6],[42,6],[43,6],[44,6],[45,6],[8,6],[51,6],[48,6],[49,6],[50,6],[52,6],[9,6],[53,6],[54,6],[55,6],[57,6],[56,6],[1,6],[95,93],[105,94],[94,93],[115,95],[86,96],[85,97],[114,98],[108,99],[113,100],[88,101],[102,102],[87,103],[111,104],[83,105],[82,98],[112,106],[84,107],[89,108],[90,6],[93,108],[80,6],[116,109],[106,110],[97,111],[98,112],[100,113],[96,114],[99,115],[109,98],[91,116],[92,117],[101,118],[81,119],[104,110],[103,108],[107,6],[110,120],[205,121],[202,122],[180,123],[178,124],[177,6],[179,125],[203,6],[204,126],[235,127],[234,6],[237,128],[233,129],[236,130],[69,6],[232,131],[225,132],[231,133],[224,134]],"latestChangedDtsFile":"./dist/index.d.ts","version":"5.9.3"}
````

## File: packages/cli/src/doctor.ts
````typescript
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
````

## File: packages/cli/src/generate-route-manifests.ts
````typescript
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
    let mode: "client" | "server" | undefined = undefined;
    if (sourceCode.startsWith('"use client"') || sourceCode.startsWith("'use client'")) {
        mode = "client";
    } else if (sourceCode.startsWith('"use server"') || sourceCode.startsWith("'use server'")) {
        mode = "server";
    }

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
````

## File: packages/cli/src/index.ts
````typescript
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
````

## File: packages/cli/src/scaffold.ts
````typescript
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
````

## File: packages/cli/package.json
````json
{
  "name": "@lito/cli",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": {
    "lito": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  }
}
````

## File: packages/cli/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/cli/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","./src/doctor.ts","./src/generate-route-manifests.ts","./src/scaffold.ts","./src/index.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts"],"fileIdsList":[[69,114,115,117,134,135],[69,116,117,134,135],[117,134,135],[69,117,122,134,135,152],[69,117,118,123,128,134,135,137,149,160],[69,117,118,119,128,134,135,137],[69,117,134,135],[64,65,66,69,117,134,135],[69,117,120,134,135,161],[69,117,121,122,129,134,135,138],[69,117,122,134,135,149,157],[69,117,123,125,128,134,135,137],[69,116,117,124,134,135],[69,117,125,126,134,135],[69,117,127,128,134,135],[69,116,117,128,134,135],[69,117,128,129,130,134,135,149,160],[69,117,128,129,130,134,135,144,149,152],[69,110,117,125,128,131,134,135,137,149,160],[69,117,128,129,131,132,134,135,137,149,157,160],[69,117,131,133,134,135,149,157,160],[67,68,69,70,71,72,73,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166],[69,117,128,134,135],[69,117,134,135,136,160],[69,117,125,128,134,135,137,149],[69,117,134,135,138],[69,117,134,135,139],[69,116,117,134,135,140],[69,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166],[69,117,134,135,142],[69,117,134,135,143],[69,117,128,134,135,144,145],[69,117,134,135,144,146,161,163],[69,117,129,134,135],[69,117,128,134,135,149,150,152],[69,117,134,135,151,152],[69,117,134,135,149,150],[69,117,134,135,152],[69,117,134,135,153],[69,114,117,134,135,149,154,160],[69,117,128,134,135,155,156],[69,117,134,135,155,156],[69,117,122,134,135,137,149,157],[69,117,134,135,158],[69,117,134,135,137,159],[69,117,131,134,135,143,160],[69,117,122,134,135,161],[69,117,134,135,149,162],[69,117,134,135,136,163],[69,117,134,135,164],[69,110,117,134,135],[69,110,117,128,130,134,135,140,149,152,160,162,163,165],[69,117,134,135,149,166],[69,82,86,117,134,135,160],[69,82,117,134,135,149,160],[69,77,117,134,135],[69,79,82,117,134,135,157,160],[69,117,134,135,137,157],[69,117,134,135,167],[69,77,117,134,135,167],[69,79,82,117,134,135,137,160],[69,74,75,78,81,117,128,134,135,149,160],[69,82,89,117,134,135],[69,74,80,117,134,135],[69,82,103,104,117,134,135],[69,78,82,117,134,135,152,160,167],[69,103,117,134,135,167],[69,76,77,117,134,135,167],[69,82,117,134,135],[69,76,77,78,79,80,81,82,83,84,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,104,105,106,107,108,109,117,134,135],[69,82,97,117,134,135],[69,82,89,90,117,134,135],[69,80,82,90,91,117,134,135],[69,81,117,134,135],[69,74,77,82,117,134,135],[69,82,86,90,91,117,134,135],[69,86,117,134,135],[69,80,82,85,117,134,135,160],[69,74,79,82,89,117,134,135],[69,117,134,135,149],[69,77,82,103,117,134,135,165,167],[69,117,129,134,135,139],[60,61,62,69,117,118,134,135,139]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"a40b207847a2752d506ae0d3ef75ced8418a14fd8a134cb27890bb3b96d26a0a","signature":"f53b132906962d79ffc64e1ab6367de2b86c4453bb29343a499705aaa7d2b83a"},{"version":"a38def2902a076036718f2e7dbb0e8112d1a8c3b67329c87a8f524462bbdc429","signature":"1c8bf60066cbe755e297e7f55c043782065976b7e348d64972a9c7594fb6f688"},{"version":"ac48002e6834152096494d6b799d6e1c9f50cbea7082d62f8261c1680ea87ced","signature":"363ae5d0623b7a3b45ddfb2b059c2ceaf9952659c6bef18556fb727a3cbc7eb5"},{"version":"e6d55f2b2b8b3cc8be33d4655492a4ddc9f7a9676f331597a4f3785ada980233","signature":"43e818adf60173644896298637f47b01d5819b17eda46eaa32d0c7d64724d012"},{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1}],"root":[[60,63]],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[114,1],[115,1],[116,2],[69,3],[117,4],[118,5],[119,6],[64,7],[67,8],[65,7],[66,7],[120,9],[121,10],[122,11],[123,12],[124,13],[125,14],[126,14],[127,15],[128,16],[129,17],[130,18],[70,7],[68,7],[131,19],[132,20],[133,21],[167,22],[134,23],[135,7],[136,24],[137,25],[138,26],[139,27],[140,28],[141,29],[142,30],[143,31],[144,32],[145,32],[146,33],[147,7],[148,34],[149,35],[151,36],[150,37],[152,38],[153,39],[154,40],[155,41],[156,42],[157,43],[158,44],[159,45],[160,46],[161,47],[162,48],[163,49],[164,50],[71,7],[72,7],[73,7],[111,51],[112,7],[113,7],[165,52],[166,53],[58,7],[59,7],[10,7],[11,7],[13,7],[12,7],[2,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],[20,7],[21,7],[3,7],[22,7],[23,7],[4,7],[24,7],[28,7],[25,7],[26,7],[27,7],[29,7],[30,7],[31,7],[5,7],[32,7],[33,7],[34,7],[35,7],[6,7],[39,7],[36,7],[37,7],[38,7],[40,7],[7,7],[41,7],[46,7],[47,7],[42,7],[43,7],[44,7],[45,7],[8,7],[51,7],[48,7],[49,7],[50,7],[52,7],[9,7],[53,7],[54,7],[55,7],[57,7],[56,7],[1,7],[89,54],[99,55],[88,54],[109,56],[80,57],[79,58],[108,59],[102,60],[107,61],[82,62],[96,63],[81,64],[105,65],[77,66],[76,59],[106,67],[78,68],[83,69],[84,7],[87,69],[74,7],[110,70],[100,71],[91,72],[92,73],[94,74],[90,75],[93,76],[103,59],[85,77],[86,78],[95,79],[75,80],[98,71],[97,69],[101,7],[104,81],[60,82],[61,82],[63,83],[62,82]],"latestChangedDtsFile":"./dist/generate-route-manifests.d.ts","version":"5.9.3"}
````

## File: packages/core/src/events.ts
````typescript
type EventMap = GlobalEventHandlersEventMap;

export type DelegatedEventHandler<K extends keyof EventMap> = (
  event: EventMap[K],
  matchedElement: Element
) => void;

export type DelegatedEventConfig = {
  [K in keyof EventMap]?: Record<string, DelegatedEventHandler<K>>;
};

export function delegateEvents(root: Element, config: DelegatedEventConfig): () => void {
  const disposers: Array<() => void> = [];

  for (const [eventName, selectors] of Object.entries(config) as Array<
    [keyof EventMap, Record<string, DelegatedEventHandler<keyof EventMap>>]
  >) {
    const listener = (event: Event) => {
      const eventTarget = event.target;
      if (!(eventTarget instanceof Element)) {
        return;
      }

      for (const [selector, handler] of Object.entries(selectors)) {
        const matchedElement = eventTarget.closest(selector);
        if (!matchedElement || !root.contains(matchedElement)) {
          continue;
        }

        handler(event as EventMap[typeof eventName], matchedElement);
        return;
      }
    };

    root.addEventListener(eventName, listener as EventListener);
    disposers.push(() => {
      root.removeEventListener(eventName, listener as EventListener);
    });
  }

  return () => {
    for (const dispose of disposers) {
      dispose();
    }
  };
}
````

## File: packages/core/src/index.ts
````typescript
// Core component
export { LitoElement } from "./lito-element.js";

// State primitives
export { signal, memo, watch, batch, track } from "./signals.js";
export type { Signal, ReadonlySignal } from "./signals.js";
export { delegateEvents } from "./events.js";
export type { DelegatedEventConfig, DelegatedEventHandler } from "./events.js";
export { isClient, isServer, onClient, onServer } from "./runtime.js";

// Store
export { store } from "./store.js";
export type { Store, StoreState } from "./store.js";

// Mixin (for advanced use — LitoElement already includes this)
export { ReactiveMixin } from "./reactive-mixin.js";
````

## File: packages/core/src/lito-element.ts
````typescript
import { LitElement } from "lit";
import { ReactiveMixin } from "./reactive-mixin.js";

/**
 * Base element for all Lito components.
 *
 * Extends `LitElement` with `ReactiveMixin` so that any signal read during
 * `render()` automatically triggers a re-render when it changes.
 *
 * ```ts
 * import { LitoElement } from '@lito/core';
 * import { signal } from '@lito/core';
 * import { html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 *
 * const name = signal('World');
 *
 * @customElement('my-greeting')
 * class MyGreeting extends LitoElement {
 *   render() {
 *     return html`<p>Hello, ${name.get()}!</p>`;
 *   }
 * }
 * ```
 */
export class LitoElement extends ReactiveMixin(LitElement) {
  protected get frameworkName(): string {
    return "Lito";
  }
}
````

## File: packages/core/src/reactive-mixin.ts
````typescript
// ---------------------------------------------------------------------------
// Lito ReactiveMixin — Auto-connect reactive reads to Lit's rendering cycle
// ---------------------------------------------------------------------------

import type { LitElement } from "lit";
import { track } from "./signals.js";

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * A mixin that automatically subscribes a Lit component to any reactive reads
 * inside `render()`. When those values change, the
 * component re-renders automatically.
 *
 * **Usage:**
 *
 * ```ts
 * import { ReactiveMixin, signal } from '@lito/core';
 * import { LitElement, html } from 'lit';
 *
 * const count = signal(0);
 *
 * class MyCounter extends ReactiveMixin(LitElement) {
 *   render() {
 *     return html`
 *       <p>Count: ${count.get()}</p>
 *       <button @click=${() => count.set(count.get() + 1)}>+1</button>
 *     `;
 *   }
 * }
 * ```
 *
 * The mixin:
 * - Tracks which reactive values are read during `render()`
 * - Auto-subscribes to those values
 * - Calls `requestUpdate()` when any tracked signal changes
 * - Cleans up subscriptions on `disconnectedCallback()`
 * - Re-subscribes on `connectedCallback()` (in case the element is re-attached)
 */
export function ReactiveMixin<T extends Constructor<LitElement>>(Base: T) {
  class SignalAwareElement extends Base {
    private __signalDisposers: Array<() => void> = [];
    private __signalConnected = false;
    private __signalUpdatePending = false;

    override connectedCallback(): void {
      super.connectedCallback();
      this.__signalConnected = true;
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      this.__signalConnected = false;
      this.__cleanupSignalSubscriptions();
    }

    override render(): unknown {
      // Cleanup previous subscriptions before re-tracking
      this.__cleanupSignalSubscriptions();

      // Run the real render inside a tracking context so we discover
      // which reactive values are read during render()
      const { result, signals } = track(() => {
        return super.render();
      });

      // Subscribe to all discovered signals
      if (this.__signalConnected) {
        for (const signal of signals) {
          const unsubscribe = signal.subscribe(() => {
            if (this.__signalConnected && !this.__signalUpdatePending) {
              this.__signalUpdatePending = true;
              // Use microtask to batch multiple signal changes into one update
              Promise.resolve().then(() => {
                this.__signalUpdatePending = false;
                if (this.__signalConnected) {
                  this.requestUpdate();
                }
              });
            }
          });
          this.__signalDisposers.push(unsubscribe);
        }
      }

      return result;
    }

    private __cleanupSignalSubscriptions(): void {
      for (const dispose of this.__signalDisposers) {
        dispose();
      }
      this.__signalDisposers = [];
    }
  }

  return SignalAwareElement as unknown as Constructor<LitElement> & T;
}
````

## File: packages/core/src/runtime.ts
````typescript
export const isClient = typeof window !== "undefined";

export const isServer = !isClient;

export function onClient(fn: () => void): void {
  if (!isClient) {
    return;
  }

  fn();
}

export function onServer(fn: () => void): void {
  if (!isServer) {
    return;
  }

  fn();
}
````

## File: packages/core/src/signals.ts
````typescript
type SignalListener<T> = (value: T) => void;
type WatchTarget = "client" | "server" | "both";
type WatchOptions = {
  target?: WatchTarget;
};

type Trackable<T> = {
  get: () => T;
  subscribe: (listener: SignalListener<T>) => () => void;
};

type TrackingContext = {
  sources: Set<Trackable<unknown>>;
};

export type Signal<T> = Trackable<T> & {
  set: (value: T) => void;
  update: (updater: (value: T) => T) => void;
};

export type ReadonlySignal<T> = Trackable<T>;

let activeTrackingContext: TrackingContext | null = null;
let batchDepth = 0;
const pendingJobs = new Set<() => void>();
const isClientRuntime = typeof window !== "undefined";
const isServerRuntime = !isClientRuntime;

function withTrackingContext<R>(context: TrackingContext, fn: () => R): R {
  const previousContext = activeTrackingContext;
  activeTrackingContext = context;

  try {
    return fn();
  } finally {
    activeTrackingContext = previousContext;
  }
}

function registerDependency(source: Trackable<unknown>) {
  activeTrackingContext?.sources.add(source);
}

function scheduleJob(job: () => void) {
  if (batchDepth > 0) {
    pendingJobs.add(job);
    return;
  }

  job();
}

function flushPendingJobs() {
  if (pendingJobs.size === 0) {
    return;
  }

  const jobs = [...pendingJobs];
  pendingJobs.clear();

  for (const job of jobs) {
    job();
  }
}

export function track<R>(fn: () => R): {
  result: R;
  signals: Set<Trackable<unknown>>;
} {
  const context: TrackingContext = {
    sources: new Set()
  };

  const result = withTrackingContext(context, fn);

  return {
    result,
    signals: context.sources
  };
}

(globalThis as typeof globalThis & {
  __LITO_TRACK__?: typeof track;
}).__LITO_TRACK__ = track;

export function batch(fn: () => void): void {
  batchDepth += 1;

  try {
    fn();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0) {
      flushPendingJobs();
    }
  }
}

export function signal<T>(initialValue: T): Signal<T> {
  let currentValue = initialValue;
  const listeners = new Set<SignalListener<T>>();

  const emit = () => {
    const nextValue = currentValue;
    for (const listener of [...listeners]) {
      listener(nextValue);
    }
  };

  return {
    get() {
      registerDependency(this);
      return currentValue;
    },
    set(value) {
      if (Object.is(currentValue, value)) {
        return;
      }

      currentValue = value;
      scheduleJob(emit);
    },
    update(updater) {
      this.set(updater(currentValue));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}

export function memo<T>(fn: () => T): ReadonlySignal<T> {
  let cachedValue: T;
  let initialized = false;
  let dirty = true;
  let dependencyDisposers: Array<() => void> = [];
  const listeners = new Set<SignalListener<T>>();

  const markDirty = () => {
    if (dirty) {
      return;
    }

    dirty = true;
    scheduleJob(emit);
  };

  const emit = () => {
    const nextValue = signal.get();
    for (const listener of [...listeners]) {
      listener(nextValue);
    }
  };

  const recompute = () => {
    for (const dispose of dependencyDisposers) {
      dispose();
    }
    dependencyDisposers = [];

    const { result, signals } = track(fn);
    cachedValue = result;
    initialized = true;
    dirty = false;

    for (const dependency of signals) {
      dependencyDisposers.push(dependency.subscribe(markDirty));
    }
  };

  const signal: ReadonlySignal<T> = {
    get() {
      registerDependency(this);

      if (!initialized || dirty) {
        recompute();
      }

      return cachedValue;
    },
    subscribe(listener) {
      listeners.add(listener);

      if (!initialized) {
        recompute();
      }

      return () => {
        listeners.delete(listener);
      };
    }
  };

  return signal;
}

export function watch(fn: () => void | (() => void), options: WatchOptions = {}): () => void {
  const target = options.target ?? "both";
  const shouldRun =
    target === "both" || (target === "client" && isClientRuntime) || (target === "server" && isServerRuntime);

  if (!shouldRun) {
    return () => {};
  }

  let stopped = false;
  let cleanup: void | (() => void);
  let dependencyDisposers: Array<() => void> = [];
  let rerunScheduled = false;

  const teardownDependencies = () => {
    for (const dispose of dependencyDisposers) {
      dispose();
    }
    dependencyDisposers = [];
  };

  const rerun = () => {
    if (stopped) {
      return;
    }

    rerunScheduled = false;
    teardownDependencies();

    if (typeof cleanup === "function") {
      cleanup();
    }

    const { result, signals } = track(fn as () => void);
    cleanup = result as void | (() => void);

    for (const dependency of signals) {
      dependencyDisposers.push(
        dependency.subscribe(() => {
          if (rerunScheduled || stopped) {
            return;
          }

          rerunScheduled = true;
          queueMicrotask(() => {
            rerun();
          });
        })
      );
    }
  };

  rerun();

  return () => {
    stopped = true;
    teardownDependencies();

    if (typeof cleanup === "function") {
      cleanup();
      cleanup = undefined;
    }
  };
}
````

## File: packages/core/src/store.ts
````typescript
import { memo, signal, type ReadonlySignal } from "./signals.js";

export type StoreState<S> = S extends Store<infer T> ? T : never;

export type Store<T extends Record<string, unknown>> = {
  get(): Readonly<T>;
  get<K extends keyof T>(key: K): T[K];
  set(partial: Partial<T>): void;
  set<K extends keyof T>(key: K, value: T[K]): void;
  subscribe(listener: (state: Readonly<T>) => void): () => void;
  subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
};

export function store<T extends Record<string, unknown>>(initialState: T): Store<T> {
  const stateSignal = signal({ ...initialState });
  const fieldSignals = new Map<keyof T, ReadonlySignal<T[keyof T]>>();

  function getFieldSignal<K extends keyof T>(key: K): ReadonlySignal<T[K]> {
    if (!fieldSignals.has(key)) {
      fieldSignals.set(
        key,
        memo(() => {
          return stateSignal.get()[key];
        }) as ReadonlySignal<T[keyof T]>
      );
    }

    return fieldSignals.get(key) as ReadonlySignal<T[K]>;
  }

  const getState = () => {
    return Object.freeze({ ...stateSignal.get() });
  };

  function get<K extends keyof T>(key: K): T[K];
  function get(): Readonly<T>;
  function get(...args: unknown[]) {
      if (args.length === 0) {
        return getState();
      }

      const key = args[0] as keyof T;
      return getFieldSignal(key).get();
  }

  function set<K extends keyof T>(key: K, value: T[K]): void;
  function set(partial: Partial<T>): void;
  function set(...args: unknown[]) {
      if (args.length === 2) {
        const key = args[0] as keyof T;
        const value = args[1] as T[keyof T];
        const currentState = stateSignal.get();

        if (Object.is(currentState[key], value)) {
          return;
        }

        stateSignal.set({
          ...currentState,
          [key]: value
        } as T);
        return;
      }

      const partial = args[0] as Partial<T>;
      const currentState = stateSignal.get();
      const nextState = {
        ...currentState,
        ...partial
      } as T;

      let changed = false;

      for (const key of Object.keys(partial) as Array<keyof T>) {
        if (!Object.is(currentState[key], nextState[key])) {
          changed = true;
          break;
        }
      }

      if (!changed) {
        return;
      }

      stateSignal.set(nextState);
  }

  function subscribe(listener: (state: Readonly<T>) => void): () => void;
  function subscribe<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
  function subscribe(...args: unknown[]) {
      if (args.length === 2) {
        const key = args[0] as keyof T;
        const listener = args[1] as (value: T[keyof T]) => void;
        return getFieldSignal(key).subscribe(listener as (value: T[keyof T]) => void);
      }

      const listener = args[0] as (state: Readonly<T>) => void;

      return stateSignal.subscribe((state) => {
        listener(Object.freeze({ ...state }));
      });
  }

  const store: Store<T> = {
    get,
    set,
    subscribe
  };

  return store;
}
````

## File: packages/core/package.json
````json
{
  "name": "@lito/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "lit": "^3.2.0"
  }
}
````

## File: packages/core/README.md
````markdown
# @lito/core

Reactive primitives and the base component layer for Lito.

## Public API

```ts
import {
  LitoElement,
  ReactiveMixin,
  signal,
  memo,
  watch,
  batch,
  track,
  store
} from "@lito/core";
```

## Quick example

```ts
import { html } from "lit";
import { LitoElement, signal, memo } from "@lito/core";

const count = signal(0);
const doubled = memo(() => count.get() * 2);

class CounterCard extends LitoElement {
  protected override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <p>Count: ${count.get()}</p>
      <p>Doubled: ${doubled.get()}</p>
      <button @click=${() => count.update((value) => value + 1)}>Increment</button>
    `;
  }
}
```

## Docs

- State guide: [../../docs/state.md](../../docs/state.md)
- Working example: `playgrounds/demo-state`
````

## File: packages/core/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/core/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","./src/events.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/css-tag.d.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/reactive-controller.d.ts","../../node_modules/.pnpm/@lit+reactive-element@2.1.2/node_modules/@lit/reactive-element/development/reactive-element.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/directive.d.ts","../../node_modules/.pnpm/@types+trusted-types@2.0.7/node_modules/@types/trusted-types/lib/index.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/lit-html.d.ts","../../node_modules/.pnpm/lit-element@4.2.2/node_modules/lit-element/development/lit-element.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/is-server.d.ts","../../node_modules/.pnpm/lit@3.3.2/node_modules/lit/development/index.d.ts","./src/signals.ts","./src/reactive-mixin.ts","./src/lito-element.ts","./src/runtime.ts","./src/store.ts","./src/index.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts"],"fileIdsList":[[81,129,146,147],[61,62,81,129,146,147],[81,126,127,129,146,147],[81,128,129,146,147],[129,146,147],[81,129,134,146,147,164],[81,129,130,135,140,146,147,149,161,172],[81,129,130,131,140,146,147,149],[76,77,78,81,129,146,147],[81,129,132,146,147,173],[81,129,133,134,141,146,147,150],[81,129,134,146,147,161,169],[81,129,135,137,140,146,147,149],[81,128,129,136,146,147],[81,129,137,138,146,147],[81,129,139,140,146,147],[81,128,129,140,146,147],[81,129,140,141,142,146,147,161,172],[81,129,140,141,142,146,147,156,161,164],[81,122,129,137,140,143,146,147,149,161,172],[81,129,140,141,143,144,146,147,149,161,169,172],[81,129,143,145,146,147,161,169,172],[79,80,81,82,83,84,85,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178],[81,129,140,146,147],[81,129,146,147,148,172],[81,129,137,140,146,147,149,161],[81,129,146,147,150],[81,129,146,147,151],[81,128,129,146,147,152],[81,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178],[81,129,146,147,154],[81,129,146,147,155],[81,129,140,146,147,156,157],[81,129,146,147,156,158,173,175],[81,129,141,146,147],[81,129,140,146,147,161,162,164],[81,129,146,147,163,164],[81,129,146,147,161,162],[81,129,146,147,164],[81,129,146,147,165],[81,126,129,146,147,161,166,172],[81,129,140,146,147,167,168],[81,129,146,147,167,168],[81,129,134,146,147,149,161,169],[81,129,146,147,170],[81,129,146,147,149,171],[81,129,143,146,147,155,172],[81,129,134,146,147,173],[81,129,146,147,161,174],[81,129,146,147,148,175],[81,129,146,147,176],[81,122,129,146,147],[81,122,129,140,142,146,147,152,161,164,172,174,175,177],[81,129,146,147,161,178],[63,66,81,129,146,147],[66,81,129,146,147],[64,65,81,129,146,147],[63,66,67,68,81,129,146,147],[81,94,98,129,146,147,172],[81,94,129,146,147,161,172],[81,89,129,146,147],[81,91,94,129,146,147,169,172],[81,129,146,147,149,169],[81,129,146,147,179],[81,89,129,146,147,179],[81,91,94,129,146,147,149,172],[81,86,87,90,93,129,140,146,147,161,172],[81,94,101,129,146,147],[81,86,92,129,146,147],[81,94,115,116,129,146,147],[81,90,94,129,146,147,164,172,179],[81,115,129,146,147,179],[81,88,89,129,146,147,179],[81,94,129,146,147],[81,88,89,90,91,92,93,94,95,96,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,116,117,118,119,120,121,129,146,147],[81,94,109,129,146,147],[81,94,101,102,129,146,147],[81,92,94,102,103,129,146,147],[81,93,129,146,147],[81,86,89,94,129,146,147],[81,94,98,102,103,129,146,147],[81,98,129,146,147],[81,92,94,97,129,146,147,172],[81,86,91,94,101,129,146,147],[81,129,146,147,161],[81,89,94,115,129,146,147,177,179],[60,70,71,72,73,74,81,129,146,147],[69,71,81,129,146,147],[69,70,81,129,146,147],[70,81,129,146,147]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"152b66abeeb6295670752e35027a014ade47df707d19e86e697d4bdf44b527cd","signature":"6d959039f744024e0905b1ab9cfd4711a899d87a6e6364dbb7433a9a2aaacfc5"},{"version":"74012d464fbc5354ca3a7d5e71bee43b17da01a853c8ff10971bbe3680c76f40","impliedFormat":99},{"version":"5e30131b6a5587fe666926ad1d9807e733c0a597ed12d682669fcaa331aea576","impliedFormat":99},{"version":"a0f82d2f9450bd147a8c137798d9501bd49b7c9e118f75b07b76709ff39b6b55","affectsGlobalScope":true,"impliedFormat":99},{"version":"00cb63103f9670f8094c238a4a7e252c8b4c06ba371fea5c44add7e41b7247e4","impliedFormat":99},{"version":"15fe687c59d62741b4494d5e623d497d55eb38966ecf5bea7f36e48fc3fbe15e","impliedFormat":1},{"version":"e09db3291e6b440f7debed2227d8357e80c95987a0d0d67ac17521d8f7b11bdb","impliedFormat":99},{"version":"9a318e3a8900672b85cd3c8c3a5acf51b88049557a3ae897ccdcf2b85a8f61f9","impliedFormat":99},{"version":"1bcd560deed90a43c51b08aa18f7f55229f2e30974ab5ed1b7bb5721be379013","impliedFormat":99},{"version":"dc08fe04e50bc24d1baded4f33e942222bbdd5d77d6341a93cfe6e4e4586a3be","impliedFormat":99},{"version":"aa4842e50792520931d3af07b003577ce0a880e1f3243c877bc51aee6bd1e5cd","signature":"d85d29c128a07aa67c806ced23d0326f8bb9bbe44edb6af9bfd527f5be87b5de"},{"version":"3df51c7c2b2706e646642d70745ea839089e12df161f8747960ea5daf8d35269","signature":"38f5555a47b87d592663d91aa4f1ddc90a2d517fb10f173890608bbaffa5d110"},{"version":"08395b98bd262672259e04cbac8e87302607334ddf082753fcfa83dc3e57264b","signature":"51302a0f5024009851391e3bb14d8c7dc917d01f0d886095ce95b747532207af"},{"version":"8a4d4741dcd2dc4eae97bf4bd69c180f1a24eafae4fb3777bf10436a336408ad","signature":"c6ef9135a320d366ac16d8e321f84407d1996ad7a415f7952965d0375590b434"},{"version":"a65ee1285fe1ff811616f94104af8928d4c52f276c7caeeda91188c8e4450622","signature":"a762cdbc2e687e0a456977e3056303e098575822e18204eccf1485774a6d2f33"},{"version":"24075cab688c458bf2afd553d9eb294a4f967edffb5bb8f0c1cec75021a7f4c5","signature":"b0ef2542461e29849ee18870cd6d5fbcc6460eae8a0c8a33bde65b1c62195418"},{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1}],"root":[60,[70,75]],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[61,1],[62,1],[63,2],[126,3],[127,3],[128,4],[81,5],[129,6],[130,7],[131,8],[76,1],[79,9],[77,1],[78,1],[132,10],[133,11],[134,12],[135,13],[136,14],[137,15],[138,15],[139,16],[140,17],[141,18],[142,19],[82,1],[80,1],[143,20],[144,21],[145,22],[179,23],[146,24],[147,1],[148,25],[149,26],[150,27],[151,28],[152,29],[153,30],[154,31],[155,32],[156,33],[157,33],[158,34],[159,1],[160,35],[161,36],[163,37],[162,38],[164,39],[165,40],[166,41],[167,42],[168,43],[169,44],[170,45],[171,46],[172,47],[173,48],[174,49],[175,50],[176,51],[83,1],[84,1],[85,1],[123,52],[124,1],[125,1],[177,53],[178,54],[65,1],[67,55],[64,56],[68,1],[66,57],[69,58],[58,1],[59,1],[10,1],[11,1],[13,1],[12,1],[2,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[3,1],[22,1],[23,1],[4,1],[24,1],[28,1],[25,1],[26,1],[27,1],[29,1],[30,1],[31,1],[5,1],[32,1],[33,1],[34,1],[35,1],[6,1],[39,1],[36,1],[37,1],[38,1],[40,1],[7,1],[41,1],[46,1],[47,1],[42,1],[43,1],[44,1],[45,1],[8,1],[51,1],[48,1],[49,1],[50,1],[52,1],[9,1],[53,1],[54,1],[55,1],[57,1],[56,1],[1,1],[101,59],[111,60],[100,59],[121,61],[92,62],[91,63],[120,64],[114,65],[119,66],[94,67],[108,68],[93,69],[117,70],[89,71],[88,64],[118,72],[90,73],[95,74],[96,1],[99,74],[86,1],[122,75],[112,76],[103,77],[104,78],[106,79],[102,80],[105,81],[115,64],[97,82],[98,83],[107,84],[87,85],[110,76],[109,74],[113,1],[116,86],[60,1],[75,87],[72,88],[71,89],[73,1],[70,1],[74,90]],"latestChangedDtsFile":"./dist/runtime.d.ts","version":"5.9.3"}
````

## File: packages/router/src/index.ts
````typescript
export type { RouteMatch, RouteDefinition, ResolvedRoute } from "./routes.js";
export { matchRoutePath, resolveRoute } from "./routes.js";
````

## File: packages/router/src/routes.ts
````typescript
export type RouteDefinition = {
  id: string;
  path: string;
};

export type RouteMatch = {
  params: Record<string, string>;
  pathname: string;
};

export type ResolvedRoute<T extends RouteDefinition> = {
  route: T;
  match: RouteMatch;
};

export function matchRoutePath(routePath: string, pathname: string): RouteMatch | null {
  const routeSegments = normalizePath(routePath).split("/").filter(Boolean);
  const pathSegments = normalizePath(pathname).split("/").filter(Boolean);

  if (routeSegments.length !== pathSegments.length) {
    return routeSegments.length === 0 && pathSegments.length === 0
      ? { params: {}, pathname: "/" }
      : null;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < routeSegments.length; index += 1) {
    const routeSegment = routeSegments[index];
    const pathSegment = pathSegments[index];

    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = decodeURIComponent(pathSegment);
      continue;
    }

    if (routeSegment !== pathSegment) {
      return null;
    }
  }

  return {
    params,
    pathname: pathname || "/"
  };
}

export function resolveRoute<T extends RouteDefinition>(
  routes: T[],
  pathname: string
): ResolvedRoute<T> | null {
  for (const route of routes) {
    const match = matchRoutePath(route.path, pathname);

    if (match) {
      return {
        route,
        match
      };
    }
  }

  return null;
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
````

## File: packages/router/package.json
````json
{
  "name": "@lito/router",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  }
}
````

## File: packages/router/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/router/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","./src/routes.ts","./src/index.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts"],"fileIdsList":[[67,112,113,115,132,133],[67,114,115,132,133],[115,132,133],[67,115,120,132,133,150],[67,115,116,121,126,132,133,135,147,158],[67,115,116,117,126,132,133,135],[67,115,132,133],[62,63,64,67,115,132,133],[67,115,118,132,133,159],[67,115,119,120,127,132,133,136],[67,115,120,132,133,147,155],[67,115,121,123,126,132,133,135],[67,114,115,122,132,133],[67,115,123,124,132,133],[67,115,125,126,132,133],[67,114,115,126,132,133],[67,115,126,127,128,132,133,147,158],[67,115,126,127,128,132,133,142,147,150],[67,108,115,123,126,129,132,133,135,147,158],[67,115,126,127,129,130,132,133,135,147,155,158],[67,115,129,131,132,133,147,155,158],[65,66,67,68,69,70,71,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164],[67,115,126,132,133],[67,115,132,133,134,158],[67,115,123,126,132,133,135,147],[67,115,132,133,136],[67,115,132,133,137],[67,114,115,132,133,138],[67,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164],[67,115,132,133,140],[67,115,132,133,141],[67,115,126,132,133,142,143],[67,115,132,133,142,144,159,161],[67,115,127,132,133],[67,115,126,132,133,147,148,150],[67,115,132,133,149,150],[67,115,132,133,147,148],[67,115,132,133,150],[67,115,132,133,151],[67,112,115,132,133,147,152,158],[67,115,126,132,133,153,154],[67,115,132,133,153,154],[67,115,120,132,133,135,147,155],[67,115,132,133,156],[67,115,132,133,135,157],[67,115,129,132,133,141,158],[67,115,120,132,133,159],[67,115,132,133,147,160],[67,115,132,133,134,161],[67,115,132,133,162],[67,108,115,132,133],[67,108,115,126,128,132,133,138,147,150,158,160,161,163],[67,115,132,133,147,164],[67,80,84,115,132,133,158],[67,80,115,132,133,147,158],[67,75,115,132,133],[67,77,80,115,132,133,155,158],[67,115,132,133,135,155],[67,115,132,133,165],[67,75,115,132,133,165],[67,77,80,115,132,133,135,158],[67,72,73,76,79,115,126,132,133,147,158],[67,80,87,115,132,133],[67,72,78,115,132,133],[67,80,101,102,115,132,133],[67,76,80,115,132,133,150,158,165],[67,101,115,132,133,165],[67,74,75,115,132,133,165],[67,80,115,132,133],[67,74,75,76,77,78,79,80,81,82,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,103,104,105,106,107,115,132,133],[67,80,95,115,132,133],[67,80,87,88,115,132,133],[67,78,80,88,89,115,132,133],[67,79,115,132,133],[67,72,75,80,115,132,133],[67,80,84,88,89,115,132,133],[67,84,115,132,133],[67,78,80,83,115,132,133,158],[67,72,77,80,87,115,132,133],[67,115,132,133,147],[67,75,80,101,115,132,133,163,165],[60,67,115,132,133]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"d9dbad666ac9e8cee1ddbdda3ecdf03ae723a92e409d344c81e499017ed840d3","signature":"0a4d42475ca59b6d047c980cc2ea7803691fc749eee6649d32b382efb314f474"},"e4cb488dbe3febfb3cd5bf613df006305cdb8d851d66c4feaa3926baba37b8f2",{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1}],"root":[60,61],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[112,1],[113,1],[114,2],[67,3],[115,4],[116,5],[117,6],[62,7],[65,8],[63,7],[64,7],[118,9],[119,10],[120,11],[121,12],[122,13],[123,14],[124,14],[125,15],[126,16],[127,17],[128,18],[68,7],[66,7],[129,19],[130,20],[131,21],[165,22],[132,23],[133,7],[134,24],[135,25],[136,26],[137,27],[138,28],[139,29],[140,30],[141,31],[142,32],[143,32],[144,33],[145,7],[146,34],[147,35],[149,36],[148,37],[150,38],[151,39],[152,40],[153,41],[154,42],[155,43],[156,44],[157,45],[158,46],[159,47],[160,48],[161,49],[162,50],[69,7],[70,7],[71,7],[109,51],[110,7],[111,7],[163,52],[164,53],[58,7],[59,7],[10,7],[11,7],[13,7],[12,7],[2,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],[20,7],[21,7],[3,7],[22,7],[23,7],[4,7],[24,7],[28,7],[25,7],[26,7],[27,7],[29,7],[30,7],[31,7],[5,7],[32,7],[33,7],[34,7],[35,7],[6,7],[39,7],[36,7],[37,7],[38,7],[40,7],[7,7],[41,7],[46,7],[47,7],[42,7],[43,7],[44,7],[45,7],[8,7],[51,7],[48,7],[49,7],[50,7],[52,7],[9,7],[53,7],[54,7],[55,7],[57,7],[56,7],[1,7],[87,54],[97,55],[86,54],[107,56],[78,57],[77,58],[106,59],[100,60],[105,61],[80,62],[94,63],[79,64],[103,65],[75,66],[74,59],[104,67],[76,68],[81,69],[82,7],[85,69],[72,7],[108,70],[98,71],[89,72],[90,73],[92,74],[88,75],[91,76],[101,59],[83,77],[84,78],[93,79],[73,80],[96,71],[95,69],[99,7],[102,81],[61,82],[60,7]],"latestChangedDtsFile":"./dist/index.d.ts","version":"5.9.3"}
````

## File: packages/server/src/client-assets.ts
````typescript
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
````

## File: packages/server/src/index.ts
````typescript
export { createDevClientAssets, createManifestClientAssets } from "./client-assets.js";
export { startLitoNodeApp } from "./node-app.js";
export { createLitoServer } from "./server.js";
export { defineApiRoute } from "./server.js";
export { readQuery } from "./server.js";
export { startLitoNodeServer } from "./node-server.js";
export type {
  LitoApiContext,
  LitoApiHandlerContext,
  LitoApiRouteDefinition,
  LitoApiRoute,
  LitoErrorPage,
  LitoErrorPageContext,
  LitoDocumentDefinition,
  LitoDocumentMetaTag,
  LitoDocumentLinkTag,
  LitoLoggerHooks,
  LitoMiddleware,
  LitoMiddlewareContext,
  LitoNotFoundPage,
  LitoPageRoute,
  LitoRequestContext,
  LitoRequestLocals,
  LitoRequestTiming,
  LitoParsedQuery,
  LitoQuerySchema,
  LitoQueryValueType,
  LitoServerEnvironment,
  LitoServerOptions,
  LitoCacheConfig
} from "./server.js";
export type { LitoClientAssets } from "./client-assets.js";
````

## File: packages/server/src/node-app.ts
````typescript
import { createServer as createNodeServer } from "node:http";
import { resolve } from "node:path";
import { getRequestListener } from "@hono/node-server";
import type { Server as NodeHttpServer } from "node:http";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { createDevClientAssets, createManifestClientAssets } from "./client-assets.js";
import {
  createLitoServer,
  type LitoApiRoute,
  type LitoErrorPage,
  type LitoLoggerHooks,
  type LitoMiddleware,
  type LitoNotFoundPage,
  type LitoPageRoute
} from "./server.js";

export type LitoNodeAppOptions = {
  appName?: string;
  port?: number;
  mode?: "development" | "production";
  rootDir?: string;
  clientEntry?: string;
  pages?: LitoPageRoute[];
  apiRoutes?: LitoApiRoute[];
  notFoundPage?: LitoNotFoundPage;
  errorPage?: LitoErrorPage;
  middlewares?: readonly LitoMiddleware[];
  logger?: LitoLoggerHooks;
  env?: Record<string, string | undefined>;
};

export type LitoNodeApp = {
  close: () => Promise<void>;
  httpServer: NodeHttpServer;
  vite?: ViteDevServer;
};

export async function startLitoNodeApp(options: LitoNodeAppOptions = {}): Promise<LitoNodeApp> {
  const port = options.port ?? 3000;
  const mode = options.mode ?? "development";
  const isProduction = mode === "production";
  const rootDir = options.rootDir ?? process.cwd();
  const distRoot = resolve(rootDir, "dist");
  const manifestPath = resolve(distRoot, "manifest.json");
  let vite: ViteDevServer | undefined;

  const app = createLitoServer({
    appName: options.appName,
    clientAssets: isProduction
      ? createManifestClientAssets({
          manifestPath
        })
      : createDevClientAssets(options.clientEntry),
    staticRoot: isProduction ? distRoot : undefined,
    pages: options.pages,
    apiRoutes: options.apiRoutes,
    notFoundPage: options.notFoundPage,
    errorPage: options.errorPage,
    middlewares: options.middlewares,
    logger: options.logger,
    env: options.env
  });

  const honoListener = getRequestListener(app.fetch);

  const httpServer = createNodeServer(async (request, response) => {
    if (vite) {
      await new Promise<void>((resolveRequest, rejectRequest) => {
        vite!.middlewares(request, response, (error?: Error) => {
          if (error) {
            rejectRequest(error);
            return;
          }

          resolveRequest();
        });
      });

      if (response.writableEnded) {
        return;
      }
    }

    await honoListener(request, response);
  });

  if (!isProduction) {
    vite = await createViteServer({
      appType: "custom",
      root: rootDir,
      server: {
        middlewareMode: {
          server: httpServer
        }
      }
    });
  }

  await new Promise<void>((resolveListen) => {
    httpServer.listen(port, resolveListen);
  });

  const close = async () => {
    await vite?.close();
    await new Promise<void>((resolveClose, rejectClose) => {
      httpServer.close((error) => {
        if (error) {
          rejectClose(error);
          return;
        }

        resolveClose();
      });
    });
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, async () => {
      await close();
      process.exit(0);
    });
  }

  return {
    close,
    httpServer,
    vite
  };
}
````

## File: packages/server/src/node-server.ts
````typescript
import { serve } from "@hono/node-server";

type StartLitoNodeServerOptions = {
  port?: number;
};

export function startLitoNodeServer(
  fetch: (request: Request) => Response | Promise<Response>,
  options: StartLitoNodeServerOptions = {}
) {
  const port = options.port ?? 3000;

  return serve({
    fetch,
    port
  });
}
````

## File: packages/server/src/server.ts
````typescript
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { resolveRoute } from "@lito/router";
import type { LitoClientAssets } from "./client-assets.js";

export type LitoServerEnvironment = Record<string, string | undefined>;

export type LitoRequestLocals = Record<string, unknown>;

export type LitoRequestTiming = {
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
};

export type LitoRequestContext = {
  request: Request;
  pathname: string;
  params: Record<string, string>;
  url: URL;
  query: URLSearchParams;
  headers: Headers;
  cookies: Readonly<Record<string, string>>;
  getCookie: (name: string) => string | undefined;
  locals: LitoRequestLocals;
  env: LitoServerEnvironment;
  timing: LitoRequestTiming;
  setLocal: <Value>(key: string, value: Value) => Value;
  getLocal: <Value>(key: string) => Value | undefined;
};

export type LitoApiContext<Params extends Record<string, string> = Record<string, string>> = Omit<
  LitoRequestContext,
  "params"
> & {
  params: Params;
};

export type LitoApiHandlerContext<
  Params extends Record<string, string> = Record<string, string>,
  QuerySchema extends LitoQuerySchema | undefined = undefined
> = LitoApiContext<Params> & {
  queryData: QuerySchema extends LitoQuerySchema ? LitoParsedQuery<QuerySchema> : undefined;
};

export type LitoQueryValueType = "string" | "number" | "boolean" | "strings";

export type LitoQuerySchema = Record<string, LitoQueryValueType>;

export type LitoParsedQuery<Schema extends LitoQuerySchema> = {
  [Key in keyof Schema]: Schema[Key] extends "number"
    ? number | null
    : Schema[Key] extends "boolean"
      ? boolean | null
      : Schema[Key] extends "strings"
        ? string[]
        : string | null;
};

export type LitoMiddlewareContext = LitoRequestContext & {
  kind: "page" | "api";
  routeId?: string;
};

export type LitoMiddleware = (context: LitoMiddlewareContext, next: () => Promise<void>) => void | Promise<void>;

export type LitoLoggerHooks = {
  onRequestStart?: (context: LitoMiddlewareContext) => void | Promise<void>;
  onRequestComplete?: (context: LitoMiddlewareContext & { response: Response }) => void | Promise<void>;
  onRequestError?: (context: LitoMiddlewareContext & { error: unknown; status: number }) => void | Promise<void>;
};

export type LitoServerOptions = {
  appName?: string;
  clientAssets?: LitoClientAssets;
  staticRoot?: string;
  pages?: LitoPageRoute[];
  apiRoutes?: LitoApiRoute[];
  notFoundPage?: LitoNotFoundPage;
  errorPage?: LitoErrorPage;
  middlewares?: readonly LitoMiddleware[];
  env?: LitoServerEnvironment;
  logger?: LitoLoggerHooks;
};

export type LitoDocumentMetaTag = {
  name?: string;
  property?: string;
  content: string;
};

export type LitoDocumentLinkTag = {
  rel: string;
  href: string;
  type?: string;
  crossorigin?: string;
  as?: string;
  media?: string;
};

export type LitoDocumentDefinition = {
  title?: string;
  lang?: string;
  meta?: LitoDocumentMetaTag[];
  links?: LitoDocumentLinkTag[];
  styles?: string[];
};

export type LitoCacheConfig = {
  maxAge: number;
  staleWhileRevalidate?: number;
};

export type LitoPageRoute<Data = unknown, ActionData = unknown> = {
  id: string;
  path: string;
  mode?: "client" | "server";
  cache?: LitoCacheConfig;
  action?: (context: LitoRequestContext) => ActionData | Promise<ActionData>;
  load?: (context: LitoRequestContext) => Data | Promise<Data>;
  document?:
    | LitoDocumentDefinition
    | ((context: LitoRequestContext & { data: Data; actionData?: ActionData }) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>);
  render: (context: LitoRequestContext & { data: Data; actionData?: ActionData }) => unknown;
};

export type LitoApiHandler = (context: LitoRequestContext) => Response | Promise<Response>;

export type LitoApiRoute = {
  id: string;
  path: string;
  get?: LitoApiHandler;
  post?: LitoApiHandler;
  put?: LitoApiHandler;
  patch?: LitoApiHandler;
  delete?: LitoApiHandler;
  options?: LitoApiHandler;
};

export type LitoApiRouteDefinition<
  Params extends Record<string, string> = Record<string, string>,
  QuerySchema extends LitoQuerySchema | undefined = undefined
> = {
  query?: QuerySchema;
  get?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
  post?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
  put?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
  patch?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
  delete?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
  options?: (context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>;
};

export type LitoNotFoundPage = {
  document?:
    | LitoDocumentDefinition
    | ((context: LitoRequestContext) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>);
  render: (context: LitoRequestContext) => unknown;
};

export type LitoErrorPageContext = LitoRequestContext & {
  error: unknown;
  status: number;
};

export type LitoErrorPage = {
  document?:
    | LitoDocumentDefinition
    | ((context: LitoErrorPageContext) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>);
  render: (context: LitoErrorPageContext) => unknown;
};

export function readQuery<Schema extends LitoQuerySchema>(
  context: Pick<LitoRequestContext, "query">,
  schema: Schema
): LitoParsedQuery<Schema> {
  const parsedEntries = Object.entries(schema).map(([key, valueType]) => {
    if (valueType === "strings") {
      return [key, context.query.getAll(key)];
    }

    const rawValue = context.query.get(key);

    if (valueType === "number") {
      if (rawValue === null) {
        return [key, null];
      }

      const parsedNumber = Number(rawValue);
      return [key, Number.isNaN(parsedNumber) ? null : parsedNumber];
    }

    if (valueType === "boolean") {
      if (rawValue === null) {
        return [key, null];
      }

      if (rawValue === "true" || rawValue === "1") {
        return [key, true];
      }

      if (rawValue === "false" || rawValue === "0") {
        return [key, false];
      }

      return [key, null];
    }

    return [key, rawValue];
  });

  return Object.fromEntries(parsedEntries) as LitoParsedQuery<Schema>;
}

export function defineApiRoute<
  Params extends Record<string, string> = Record<string, string>,
  QuerySchema extends LitoQuerySchema | undefined = undefined
>(definition: LitoApiRouteDefinition<Params, QuerySchema>) {
  const createHandler = (
    handler:
      | ((context: LitoApiHandlerContext<Params, QuerySchema>) => Response | Promise<Response>)
      | undefined
  ): LitoApiHandler | undefined => {
    if (!handler) {
      return undefined;
    }

    return (context) =>
      handler({
        ...(context as LitoApiContext<Params>),
        queryData: definition.query ? readQuery(context, definition.query) : undefined
      } as LitoApiHandlerContext<Params, QuerySchema>);
  };

  return {
    get: createHandler(definition.get),
    post: createHandler(definition.post),
    put: createHandler(definition.put),
    patch: createHandler(definition.patch),
    delete: createHandler(definition.delete),
    options: createHandler(definition.options)
  } satisfies Omit<LitoApiRoute, "id" | "path">;
}

export function createLitoServer(options: LitoServerOptions = {}) {
  const app = new Hono();
  const appName = options.appName ?? "Lito";
  const pages = options.pages ?? [];
  const apiRoutes = options.apiRoutes ?? [];
  const middlewares = options.middlewares ?? [];
  const env = options.env ?? process.env;
  const logger = options.logger;

  if (options.staticRoot) {
    app.use("/assets/*", serveStatic({ root: options.staticRoot }));
  }

  registerApiRoutes(app, {
    appName,
    env,
    logger,
    middlewares,
    routes: apiRoutes
  });

  app.all("/", async (context) => {
    if (pages.length === 0) {
      return context.text(`${appName} server scaffold is running.`);
    }

    return handlePageRequest({
      appName,
      clientAssets: options.clientAssets,
      env,
      errorPage: options.errorPage,
      logger,
      middlewares,
      notFoundPage: options.notFoundPage,
      pages,
      request: context.req.raw
    });
  });

  app.all("*", async (context) =>
    handlePageRequest({
      appName,
      clientAssets: options.clientAssets,
      env,
      errorPage: options.errorPage,
      logger,
      middlewares,
      notFoundPage: options.notFoundPage,
      pages,
      request: context.req.raw
    })
  );

  return app;
}

function registerApiRoutes(
  app: Hono,
  input: {
    appName: string;
    env: LitoServerEnvironment;
    logger?: LitoLoggerHooks;
    middlewares: readonly LitoMiddleware[];
    routes: readonly LitoApiRoute[];
  }
) {
  if (input.routes.length === 0) {
    app.get("/api/health", (context) => {
      return context.json({
        ok: true,
        appName: input.appName
      });
    });
    return;
  }

  for (const route of input.routes) {
    const methodEntries = [
      ["get", route.get],
      ["post", route.post],
      ["put", route.put],
      ["patch", route.patch],
      ["delete", route.delete],
      ["options", route.options]
    ] as const;

    for (const [methodName, handler] of methodEntries) {
      if (!handler) continue;

      app.on(methodName.toUpperCase(), route.path, async (context) => {
        const requestContext = createRequestContext({
          env: input.env,
          params: context.req.param(),
          pathname: new URL(context.req.raw.url).pathname,
          request: context.req.raw
        });
        const loggerContext = createLoggerContext(requestContext, "api", route.id);

        try {
          await input.logger?.onRequestStart?.(loggerContext);
          await runMiddlewares({
            context: requestContext,
            kind: "api",
            middlewares: input.middlewares,
            routeId: route.id
          });
          const response = await handler(requestContext);
          finalizeRequestTiming(requestContext);
          await input.logger?.onRequestComplete?.({
            ...loggerContext,
            response
          });
          return response;
        } catch (error) {
          finalizeRequestTiming(requestContext);
          await input.logger?.onRequestError?.({
            ...loggerContext,
            error,
            status: 500
          });
          return createApiErrorResponse(error);
        }
      });
    }
  }
}

async function handlePageRequest(input: {
  appName: string;
  clientAssets?: LitoClientAssets;
  env: LitoServerEnvironment;
  errorPage?: LitoErrorPage;
  logger?: LitoLoggerHooks;
  middlewares: readonly LitoMiddleware[];
  notFoundPage?: LitoNotFoundPage;
  pages: readonly LitoPageRoute[];
  request: Request;
}) {
  if (input.pages.length === 0) {
    return new Response(`${input.appName} server scaffold is running.`, {
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }

  const url = new URL(input.request.url);
  const resolvedRoute = resolveRoute([...input.pages], url.pathname);
  const requestContext = createRequestContext({
    env: input.env,
    params: resolvedRoute?.match.params ?? {},
    pathname: resolvedRoute?.match.pathname ?? url.pathname,
    request: input.request
  });

  if (!resolvedRoute) {
    const loggerContext = createLoggerContext(requestContext, "page");
    await input.logger?.onRequestStart?.(loggerContext);
    await runMiddlewares({
      context: requestContext,
      kind: "page",
      middlewares: input.middlewares
    });

    const response = input.notFoundPage
      ? await renderNotFoundPage({
          appName: input.appName,
          clientAssets: input.clientAssets,
          context: requestContext,
          page: input.notFoundPage
        })
      : new Response("Not Found", {
          status: 404,
          headers: {
            "content-type": "text/plain; charset=utf-8"
          }
        });

    finalizeRequestTiming(requestContext);
    await input.logger?.onRequestComplete?.({
      ...loggerContext,
      response
    });
    return response;
  }

  const loggerContext = createLoggerContext(requestContext, "page", resolvedRoute.route.id);

  try {
    await input.logger?.onRequestStart?.(loggerContext);
    await runMiddlewares({
      context: requestContext,
      kind: "page",
      middlewares: input.middlewares,
      routeId: resolvedRoute.route.id
    });

    const response = await renderMatchedPage({
      appName: input.appName,
      clientAssets: input.clientAssets,
      context: requestContext,
      route: resolvedRoute.route
    });
    finalizeRequestTiming(requestContext);
    await input.logger?.onRequestComplete?.({
      ...loggerContext,
      response
    });
    return response;
  } catch (error) {
    finalizeRequestTiming(requestContext);
    
    console.error("[Lito Server Error]", error);

    await input.logger?.onRequestError?.({
      ...loggerContext,
      error,
      status: 500
    });

    if (input.errorPage) {
      return renderErrorPage({
        appName: input.appName,
        clientAssets: input.clientAssets,
        context: requestContext,
        error,
        page: input.errorPage,
        status: 500
      });
    }

    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "content-type": "text/plain; charset=utf-8"
      }
    });
  }
}

const ssrInternalCache = new Map<string, { body: string; headers: [string, string][]; expiry: number; staleExpiry: number }>();

async function executeAndCachePage(
  input: {
    appName: string;
    clientAssets?: LitoClientAssets;
    context: LitoRequestContext;
    route: LitoPageRoute;
  },
  cacheKey: string
) {
  const method = input.context.request.method;
  const isMutation = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  const isClientOnly = input.route.mode === "client";

  let actionData: unknown = undefined;

  if (isMutation) {
    if (!input.route.action) {
      return new Response("Method Not Allowed", { status: 405 });
    }
    actionData = await input.route.action(input.context);
  }

  const data = !isClientOnly && input.route.load ? await input.route.load(input.context) : undefined;
  
  const template = !isClientOnly ? input.route.render({
    ...input.context,
    data,
    actionData
  }) : undefined;

  const document = input.route.document
    ? await resolveDocumentDefinition(input.route.document, {
        ...input.context,
        data,
        actionData
      })
    : undefined;
  
  const body = isClientOnly
    ? `<div id="lito-client-root" data-route-id="${escapeHtml(input.route.id)}"></div>` 
    : await collectResult(render(template));

  const response = createHtmlResponse({
    appName: input.appName,
    body,
    clientAssets: input.clientAssets,
    data,
    actionData,
    document
  });

  if (input.route.cache && response.status === 200) {
    const htmlString = await response.clone().text();
    const maxAgeMs = input.route.cache.maxAge * 1000;
    const staleMs = (input.route.cache.staleWhileRevalidate ?? 0) * 1000;
    
    response.headers.set('Cache-Control', `public, max-age=${input.route.cache.maxAge}${input.route.cache.staleWhileRevalidate ? `, stale-while-revalidate=${input.route.cache.staleWhileRevalidate}` : ''}`);
    
    ssrInternalCache.set(cacheKey, {
      body: htmlString,
      headers: Array.from(response.headers.entries()),
      expiry: Date.now() + maxAgeMs,
      staleExpiry: staleMs ? Date.now() + maxAgeMs + staleMs : 0
    });
  }

  return response;
}

async function renderMatchedPage(input: {
  appName: string;
  clientAssets?: LitoClientAssets;
  context: LitoRequestContext;
  route: LitoPageRoute;
}) {
  const cacheKey = input.context.url.pathname + input.context.url.search;
  const method = input.context.request.method;
  const isGetOrHead = method === "GET" || method === "HEAD";

  if (input.route.cache && isGetOrHead) {
    const cached = ssrInternalCache.get(cacheKey);
    const now = Date.now();
    if (cached) {
      if (now < cached.expiry) {
        return new Response(cached.body, { headers: new Headers(cached.headers), status: 200 });
      }
      if (cached.staleExpiry && now < cached.staleExpiry) {
        // Serve stale, rebuild background
        setTimeout(() => {
          executeAndCachePage(input, cacheKey).catch((err) => console.error("[LITO] Background cache revalidation failed:", err));
        }, 0);
        return new Response(cached.body, { headers: new Headers(cached.headers), status: 200 });
      }
    }
  }

  return executeAndCachePage(input, cacheKey);
}

async function renderNotFoundPage(input: {
  appName: string;
  clientAssets?: LitoClientAssets;
  context: LitoRequestContext;
  page: LitoNotFoundPage;
}) {
  const template = input.page.render(input.context);
  const document = input.page.document ? await resolveDocumentDefinition(input.page.document, input.context) : undefined;
  const body = await collectResult(render(template));

  return createHtmlResponse({
    appName: input.appName,
    body,
    clientAssets: input.clientAssets,
    data: null,
    document,
    status: 404
  });
}

async function renderErrorPage(input: {
  appName: string;
  clientAssets?: LitoClientAssets;
  context: LitoRequestContext;
  error: unknown;
  page: LitoErrorPage;
  status: number;
}) {
  const errorContext: LitoErrorPageContext = {
    ...input.context,
    error: input.error,
    status: input.status
  };
  const template = input.page.render(errorContext);
  const document = input.page.document ? await resolveDocumentDefinition(input.page.document, errorContext) : undefined;
  const body = await collectResult(render(template));

  return createHtmlResponse({
    appName: input.appName,
    body,
    clientAssets: input.clientAssets,
    data: {
      error: {
        status: input.status
      }
    },
    document,
    status: input.status
  });
}

function createRequestContext(input: {
  env: LitoServerEnvironment;
  params: Record<string, string>;
  pathname: string;
  request: Request;
}): LitoRequestContext {
  const locals: LitoRequestLocals = {};
  const url = new URL(input.request.url);
  const cookies = parseCookies(input.request.headers.get("cookie"));

  return {
    request: input.request,
    pathname: input.pathname,
    params: input.params,
    url,
    query: url.searchParams,
    headers: input.request.headers,
    cookies,
    getCookie: (name) => cookies[name],
    locals,
    env: input.env,
    timing: {
      startedAt: Date.now()
    },
    setLocal: (key, value) => {
      locals[key] = value;
      return value;
    },
    getLocal: (key) => locals[key] as never
  };
}

async function runMiddlewares(input: {
  context: LitoRequestContext;
  kind: "page" | "api";
  middlewares: readonly LitoMiddleware[];
  routeId?: string;
}) {
  let currentIndex = -1;

  const dispatch = async (index: number): Promise<void> => {
    if (index <= currentIndex) {
      throw new Error("Lito middleware `next()` called multiple times.");
    }

    currentIndex = index;
    const middleware = input.middlewares[index];

    if (!middleware) {
      return;
    }

    await middleware(
      {
        ...input.context,
        kind: input.kind,
        routeId: input.routeId
      },
      async () => {
        await dispatch(index + 1);
      }
    );
  };

  await dispatch(0);
}

function createApiErrorResponse(error: unknown) {
  return Response.json(
    {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : "Internal Server Error"
      }
    },
    {
      status: 500
    }
  );
}

function createHtmlResponse(input: {
  appName: string;
  body: string;
  clientAssets?: LitoClientAssets;
  data: unknown;
  actionData?: unknown;
  document?: LitoDocumentDefinition;
  status?: number;
}) {
  return new Response(
    createHtmlDocument({
      appName: input.appName,
      body: input.body,
      clientAssets: input.clientAssets,
      data: input.data,
      actionData: input.actionData,
      document: input.document
    }),
    {
      status: input.status ?? 200,
      headers: {
        "content-type": "text/html; charset=utf-8"
      }
    }
  );
}

function createHtmlDocument(input: {
  appName: string;
  body: string;
  clientAssets?: LitoClientAssets;
  data: unknown;
  actionData?: unknown;
  document?: LitoDocumentDefinition;
}) {
  const clientScript = (input.clientAssets?.scripts ?? [])
    .map((script) => `<script type="module" src="${script}"></script>`)
    .join("\n    ");
  const clientStyles = (input.clientAssets?.styles ?? [])
    .map((style) => `<link rel="stylesheet" href="${escapeHtml(style)}" />`)
    .join("\n    ");
  const payload = { pageData: input.data, actionData: input.actionData };

  const serializedData = serializePageData(payload);
  const title = escapeHtml(input.document?.title ?? input.appName);
  const lang = escapeHtml(input.document?.lang ?? "en");
  const metaTags = (input.document?.meta ?? [])
    .map((tag) => createMetaTag(tag))
    .join("\n    ");
  const documentLinkTags = (input.document?.links ?? [])
    .map((link) => createLinkTag(link))
    .join("\n    ");
  const styleTags = (input.document?.styles ?? [])
    .map((style, index) => `<style data-lito-style="${index}">${escapeStyle(style)}</style>`)
    .join("\n    ");
  const optionalHeadTags = [metaTags, documentLinkTags, clientStyles, styleTags].filter(Boolean).join("\n    ");

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${optionalHeadTags}
  </head>
  <body>
    <div id="app">${input.body}</div>
    <script>window.__LITO_DATA__=${serializedData};</script>
    ${clientScript}
  </body>
</html>`;
}

function serializePageData(data: unknown) {
  return JSON.stringify(data ?? null).replace(/</g, "\\u003c");
}

async function resolveDocumentDefinition<ContextType>(
  definition:
    | LitoDocumentDefinition
    | ((context: ContextType) => LitoDocumentDefinition | Promise<LitoDocumentDefinition>),
  context: ContextType
) {
  return typeof definition === "function" ? await definition(context) : definition;
}

function createMetaTag(tag: LitoDocumentMetaTag) {
  const attributes = [
    tag.name ? `name="${escapeHtml(tag.name)}"` : "",
    tag.property ? `property="${escapeHtml(tag.property)}"` : "",
    `content="${escapeHtml(tag.content)}"`
  ]
    .filter(Boolean)
    .join(" ");

  return `<meta ${attributes} />`;
}

function createLinkTag(tag: LitoDocumentLinkTag) {
  const attributes = [
    `rel="${escapeHtml(tag.rel)}"`,
    `href="${escapeHtml(tag.href)}"`,
    tag.type ? `type="${escapeHtml(tag.type)}"` : "",
    tag.crossorigin ? `crossorigin="${escapeHtml(tag.crossorigin)}"` : "",
    tag.as ? `as="${escapeHtml(tag.as)}"` : "",
    tag.media ? `media="${escapeHtml(tag.media)}"` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `<link ${attributes} />`;
}

function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) {
    return {} as Readonly<Record<string, string>>;
  }

  const entries = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return [part, ""] as const;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex));
      const value = decodeURIComponent(part.slice(separatorIndex + 1));
      return [key, value] as const;
    });

  return Object.freeze(Object.fromEntries(entries));
}

function createLoggerContext(context: LitoRequestContext, kind: "page" | "api", routeId?: string): LitoMiddlewareContext {
  return {
    ...context,
    kind,
    routeId
  };
}

function finalizeRequestTiming(context: LitoRequestContext) {
  if (context.timing.endedAt) {
    return;
  }

  context.timing.endedAt = Date.now();
  context.timing.durationMs = context.timing.endedAt - context.timing.startedAt;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeStyle(value: string) {
  return value.replace(/<\/style/gi, "<\\/style");
}
````

## File: packages/server/package.json
````json
{
  "name": "@lito/server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "@hono/node-server": "^1.19.0",
    "@lit-labs/ssr": "^3.3.1",
    "@lito/router": "workspace:*",
    "hono": "^4.7.7",
    "vite": "^5.4.19"
  }
}
````

## File: packages/server/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/server/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","./src/client-assets.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/types.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/server.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/listener.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/request.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts","../../node_modules/.pnpm/@types+estree@1.0.8/node_modules/@types/estree/index.d.ts","../../node_modules/.pnpm/rollup@4.60.1/node_modules/rollup/dist/rollup.d.ts","../../node_modules/.pnpm/rollup@4.60.1/node_modules/rollup/dist/parseast.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/hmrpayload.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/customevent.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/hot.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/types.d-agj9qkwt.d.ts","../../node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/lib/main.d.ts","../../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/source-map.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/previous-map.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/input.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/css-syntax-error.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/declaration.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/root.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/warning.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/lazy-result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/no-work-result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/processor.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/result.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/document.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/rule.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/node.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/comment.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/container.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/at-rule.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/list.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/postcss.d.ts","../../node_modules/.pnpm/postcss@8.5.9/node_modules/postcss/lib/postcss.d.mts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/runtime.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/importglob.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/types/metadata.d.ts","../../node_modules/.pnpm/vite@5.4.21_@types+node@22.19.17/node_modules/vite/dist/node/index.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/request/constants.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/router.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/headers.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/http-status.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/body.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/request.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/utils/mime.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/context.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/hono-base.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/hono.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/types.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/client.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/fetch-result-please.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/utils.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/client/index.d.ts","../../node_modules/.pnpm/hono@4.12.12/node_modules/hono/dist/types/index.d.ts","../../node_modules/.pnpm/@hono+node-server@1.19.14_hono@4.12.12/node_modules/@hono/node-server/dist/serve-static.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/lib/render-result.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/lib/element-renderer.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/lib/render-value.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/lib/render.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/directive.d.ts","../../node_modules/.pnpm/@types+trusted-types@2.0.7/node_modules/@types/trusted-types/lib/index.d.ts","../../node_modules/.pnpm/lit-html@3.3.2/node_modules/lit-html/development/lit-html.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/lib/server-template.d.ts","../../node_modules/.pnpm/@lit-labs+ssr@3.3.1/node_modules/@lit-labs/ssr/index.d.ts","../router/dist/routes.d.ts","../router/dist/index.d.ts","./src/server.ts","./src/node-app.ts","./src/node-server.ts","./src/index.ts"],"fileIdsList":[[61,62,63,64,71,119,133,134,135,136,137,139],[61,71,119,133,134,135,136,137],[71,119,133,134,136,137],[71,119,136,137,219],[61,71,119,133,134,135,136,137,139],[71,119,133,134,135,136,137],[71,119,136,137,222,224,228],[71,119,136,137,221,223],[71,119,136,137],[71,119,136,137,221,222],[71,119,136,137,227],[71,116,117,119,136,137],[71,118,119,136,137],[119,136,137],[71,119,124,136,137,154],[71,119,120,125,130,136,137,139,151,162],[71,119,120,121,130,136,137,139],[66,67,68,71,119,136,137],[71,119,122,136,137,163],[71,119,123,124,131,136,137,140],[71,119,124,136,137,151,159],[71,119,125,127,130,136,137,139],[71,118,119,126,136,137],[71,119,127,128,136,137],[71,119,129,130,136,137],[71,118,119,130,136,137],[71,119,130,131,132,136,137,151,162],[71,119,130,131,132,136,137,146,151,154],[71,112,119,127,130,133,136,137,139,151,162],[71,119,130,131,133,134,136,137,139,151,159,162],[71,119,133,135,136,137,151,159,162],[69,70,71,72,73,74,75,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168],[71,119,130,136,137],[71,119,136,137,138,162],[71,119,127,130,136,137,139,151],[71,119,136,137,140],[71,119,136,137,141],[71,118,119,136,137,142],[71,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168],[71,119,136,137,144],[71,119,136,137,145],[71,119,130,136,137,146,147],[71,119,136,137,146,148,163,165],[71,119,131,136,137],[71,119,130,136,137,151,152,154],[71,119,136,137,153,154],[71,119,136,137,151,152],[71,119,136,137,154],[71,119,136,137,155],[71,116,119,136,137,151,156,162],[71,119,130,136,137,157,158],[71,119,136,137,157,158],[71,119,124,136,137,139,151,159],[71,119,136,137,160],[71,119,136,137,139,161],[71,119,133,136,137,145,162],[71,119,124,136,137,163],[71,119,136,137,151,164],[71,119,136,137,138,165],[71,119,136,137,166],[71,112,119,136,137],[71,112,119,130,132,136,137,142,151,154,162,164,165,167],[71,119,136,137,151,168],[71,119,136,137,206,213,214],[71,119,136,137,214,215,217],[71,119,136,137,203,205,206,207,212,213],[71,119,136,137,205,214,216],[71,119,136,137,203,204,205,206,207,209,210],[71,119,136,137,203,207,211],[71,119,136,137,207,212],[71,119,136,137,207,209,211,213,218],[71,119,136,137,202,203,204,206,207,208],[71,119,136,137,204,205,206,211,212],[71,119,136,137,209],[71,119,136,137,225,226],[71,119,136,137,193],[71,119,136,137,191,193],[71,119,136,137,182,190,191,192,194,196],[71,119,136,137,180],[71,119,136,137,183,188,193,196],[71,119,136,137,179,196],[71,119,136,137,183,184,187,188,189,196],[71,119,136,137,183,184,185,187,188,196],[71,119,136,137,180,181,182,183,184,188,189,190,192,193,194,196],[71,119,136,137,196],[71,119,136,137,178,180,181,182,183,184,185,187,188,189,190,191,192,193,194,195],[71,119,136,137,178,196],[71,119,136,137,183,185,186,188,189,196],[71,119,136,137,187,196],[71,119,136,137,188,189,193,196],[71,119,136,137,181,191],[71,119,136,137,171,200],[71,119,136,137,170,171],[71,84,88,119,136,137,162],[71,84,119,136,137,151,162],[71,79,119,136,137],[71,81,84,119,136,137,159,162],[71,119,136,137,139,159],[71,119,136,137,169],[71,79,119,136,137,169],[71,81,84,119,136,137,139,162],[71,76,77,80,83,119,130,136,137,151,162],[71,84,91,119,136,137],[71,76,82,119,136,137],[71,84,105,106,119,136,137],[71,80,84,119,136,137,154,162,169],[71,105,119,136,137,169],[71,78,79,119,136,137,169],[71,84,119,136,137],[71,78,79,80,81,82,83,84,85,86,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,106,107,108,109,110,111,119,136,137],[71,84,99,119,136,137],[71,84,91,92,119,136,137],[71,82,84,92,93,119,136,137],[71,83,119,136,137],[71,76,79,84,119,136,137],[71,84,88,92,93,119,136,137],[71,88,119,136,137],[71,82,84,87,119,136,137,162],[71,76,81,84,91,119,136,137],[71,119,136,137,151],[71,79,84,105,119,136,137,167,169],[71,119,130,131,133,134,135,136,137,139,151,159,162,168,169,171,172,173,174,175,176,177,197,198,199,200],[71,119,136,137,173,174,175,176],[71,119,136,137,173,174,175],[71,119,136,137,173],[71,119,136,137,174],[71,119,136,137,171],[71,119,136,137,230],[60,71,119,136,137,232,233,234],[60,65,71,119,133,136,137,141,201,232],[65,71,119,136,137],[60,71,119,136,137,219,220,221,229,231]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"ff12f1f8f7356aea52848c766d19e94c7d7d20555cb10be7469f90d215e9ca91","signature":"2aa8d0bb5c3019d6f8f2855a7a236f30dc2077994c729656fd3d4cda3f5708c0"},{"version":"77ce0e4b752d448462724acefb13f0b0a9b132b507e3eeb7466276190e708d04","impliedFormat":1},{"version":"e00dbc9d2c4dba5e071dc5e6ef53d119dcc80ab6865a07cbf6ba180571092778","impliedFormat":1},{"version":"596bc47c8cad767619763941150e1c08c4a863950f07bcc0ff3c16ea60a6e730","impliedFormat":1},{"version":"304115b5c6200938be92e5daf0cb1b59468e47ca558184cc0c900aa8294e7f55","impliedFormat":1},{"version":"039ded2c755746d4d93c865d26222f8279a9e836ccefc258ba3ab73b810322a6","impliedFormat":1},{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1},{"version":"151ff381ef9ff8da2da9b9663ebf657eac35c4c9a19183420c05728f31a6761d","impliedFormat":1},{"version":"ee70b8037ecdf0de6c04f35277f253663a536d7e38f1539d270e4e916d225a3f","affectsGlobalScope":true,"impliedFormat":1},{"version":"a660aa95476042d3fdcc1343cf6bb8fdf24772d31712b1db321c5a4dcc325434","impliedFormat":1},{"version":"282f98006ed7fa9bb2cd9bdbe2524595cfc4bcd58a0bb3232e4519f2138df811","impliedFormat":1},{"version":"6222e987b58abfe92597e1273ad7233626285bc2d78409d4a7b113d81a83496b","impliedFormat":1},{"version":"cbe726263ae9a7bf32352380f7e8ab66ee25b3457137e316929269c19e18a2be","impliedFormat":1},{"version":"8b96046bf5fb0a815cba6b0880d9f97b7f3a93cf187e8dcfe8e2792e97f38f87","impliedFormat":99},{"version":"bacf2c84cf448b2cd02c717ad46c3d7fd530e0c91282888c923ad64810a4d511","affectsGlobalScope":true,"impliedFormat":1},{"version":"402e5c534fb2b85fa771170595db3ac0dd532112c8fa44fc23f233bc6967488b","impliedFormat":1},{"version":"52dcc257df5119fb66d864625112ce5033ac51a4c2afe376a0b299d2f7f76e4a","impliedFormat":1},{"version":"e5bab5f871ef708d52d47b3e5d0aa72a08ee7a152f33931d9a60809711a2a9a3","impliedFormat":1},{"version":"e16dc2a81595736024a206c7d5c8a39bfe2e6039208ef29981d0d95434ba8fcf","impliedFormat":1},{"version":"cc4a4903fb698ca1d961d4c10dce658aa3a479faf40509d526f122b044eaf6a4","impliedFormat":1},{"version":"19ee8416e6473ed6c7adb868fa796b5653cf0fa2a337658e677eaa0d134388c3","impliedFormat":1},{"version":"1328ab4e442614b28cdb3d4b414cf68325c0da0dca07287a338d0654b7a00261","impliedFormat":1},{"version":"a039dc21f045919f3cbee2ec13812cc6cc3eebc99dae4be00973230f468d19a6","impliedFormat":1},{"version":"3fbe57af01460e49dcd29df55d6931e1672bc6f1be0fb073d11410bc16f9037d","impliedFormat":1},{"version":"f760be449e8562ec5c09bb5187e8e1eabf3c113c0c58cddda53ef8c69f3e2131","impliedFormat":1},{"version":"44325ed13294fce6ab825b82947bbeed2611db7dad9d9135260192f375e5a189","impliedFormat":1},{"version":"e392e8fb5b514eafc585601c1d781485aa6dd6a320e75daf1064a4c6918a1b45","impliedFormat":1},{"version":"46e4a36e8ddbdfb4e7330e11c81c970dc8b218611df9183d39c41c5f8c653b55","impliedFormat":1},{"version":"370bde134aa8c2abc926d0e99d3a4d5d5dba65c6ee65459137e4f02670cbf841","impliedFormat":1},{"version":"6332f565867cf4a740a70e30f31cefba37ef7cebcf74f22eab8d744fde6d193e","impliedFormat":1},{"version":"2977b7884aedc895a1d0c9c210c7cf3272c29d6959a08a6fa3ff71e0aff08175","impliedFormat":1},{"version":"17f2922d41ddd032830a91371c948cd9ce903b35c95adca72271a54584f19b0b","impliedFormat":1},{"version":"3eed76ede2a1a14d7c9bb0a642041282dcc264811139d3dd275c9fe14efc9840","impliedFormat":1},{"version":"00cf4001e0d9c6e5e036bc545b9d73e2b8b84cddb02e61ad05bab3752b1d4522","impliedFormat":1},{"version":"8d369483f0c2b9ee388129cfdb6a43bc8112b377e86a41884bd06e19ce04f4c1","impliedFormat":99},{"version":"82e687ebd99518bc63ea04b0c3810fb6e50aa6942decd0ca6f7a56d9b9a212a6","impliedFormat":99},{"version":"7f698624bbbb060ece7c0e51b7236520ebada74b747d7523c7df376453ed6fea","impliedFormat":1},{"version":"8f07f2b6514744ac96e51d7cb8518c0f4de319471237ea10cf688b8d0e9d0225","impliedFormat":1},{"version":"257b83faa134d971c738a6b9e4c47e59bb7b23274719d92197580dd662bfafc3","impliedFormat":99},{"version":"a8cc184ee589bd3806e9e2c5b113f66c5953a20502775adabbce54ec30de8052","impliedFormat":1},{"version":"a033992e14caa339d5b5ba48061035be198e008296b95bc3f0cdaa5c02a845c8","impliedFormat":1},{"version":"b9c8c2b3e7b665f0d8f07c46e4ee4ef586f4fa6e2a9b7e05b453737d7e144d3e","impliedFormat":1},{"version":"984c26e8864dc326bf6f7a72f89625b3facd86a901d406b7e54aca3d6ef9d674","impliedFormat":1},{"version":"9065f8bfa4e2bbbb38964d8f93a052965e432beb813c444db26a6494434482aa","impliedFormat":1},{"version":"ca6e767165251f4ec3fed240d95ebf19564a9ca99974adde254c9f73fc25d2bf","impliedFormat":1},{"version":"5c9b631fd684665b7ab77aadfae34060a03e049bf2b39166a4e3878a2fe978dc","impliedFormat":1},{"version":"4f8ab5f636fe50dee05fdaed4f4d7a68458edcaf65bc7c7e0764710a9738d435","impliedFormat":1},{"version":"304797c1a60c5f9d85cc55c1b21cdf6d327957cd61191dfc60357b4227b2a94b","impliedFormat":1},{"version":"1ab578c2a429a3c9cc09da99161712aca9730b56452bcf9d7d95c434a9ff2cc9","impliedFormat":1},{"version":"a9382cc4fe0533a57a86e32684d916899528dac08c03bae387a7afacde76cd4a","impliedFormat":1},{"version":"45dd008396b925f1d22bd7c9adbacce9cf66a929ddd4ffb80dc936863bffe103","impliedFormat":1},{"version":"2c01a3ba2a23b8a3a85e12de6e1c7347dfb6554da9e30b49bbb125f6fd217462","impliedFormat":1},{"version":"f19e3abbf04cb89295686f97190766a0b21d1a8191b86e52c63765cfd09b19ca","impliedFormat":1},{"version":"f5bfda545fc03ca1b3dae2cf4c44d06e74bc9865a6a038272ecc4de91dc78685","impliedFormat":1},{"version":"4f6a71f795afdbc9389eb2c8d7ea9f228d95b0d70dfff00a2cf357aecb26f394","impliedFormat":1},{"version":"a01c34217ba822ccd2dd0040822c1f615eeee8ea957efdcb62526152024d9dc6","impliedFormat":1},{"version":"38bf0f2ce09fcf3eba1db11181696a3ffc32a795974d67cef41ff756e08a5c2e","impliedFormat":1},{"version":"2cbee9caa5a9cb218dc8d4f23efd7bc585d13eec3b8ff7f111bc36dd5cb611a8","impliedFormat":1},{"version":"ace577ad9a199ed510986e38aab588dadb6f6da5062aa6fc263c71b9e7421ab9","impliedFormat":99},{"version":"2de8ce44957b729b2b21a5c66f0522d10118adf1991e606122e553bdc5ba5043","impliedFormat":99},{"version":"e9699c7badc17ce664071e09c6c93fb50d180d02116e0fdd4947b5b2f67d0720","affectsGlobalScope":true,"impliedFormat":99},{"version":"6d45dd596ba3aa26beb91fbc6ecb2d47313c7726aa98572b986f3ae3c848d97e","impliedFormat":99},{"version":"00cb63103f9670f8094c238a4a7e252c8b4c06ba371fea5c44add7e41b7247e4","impliedFormat":99},{"version":"15fe687c59d62741b4494d5e623d497d55eb38966ecf5bea7f36e48fc3fbe15e","impliedFormat":1},{"version":"e09db3291e6b440f7debed2227d8357e80c95987a0d0d67ac17521d8f7b11bdb","impliedFormat":99},{"version":"ede61bfb01ab91127e59fd49af1f975de1d19f5617a4f66a834842ee9a532e8f","impliedFormat":99},{"version":"13059477d450edda09b9299a7d7e97180d063f32024d31b45ab41e86648d9cce","impliedFormat":99},"0a4d42475ca59b6d047c980cc2ea7803691fc749eee6649d32b382efb314f474","e4cb488dbe3febfb3cd5bf613df006305cdb8d851d66c4feaa3926baba37b8f2",{"version":"364bab7f1c29788dfb435bb95e19809ee68d5610d1706bdf75e0373d025427c3","signature":"46a759c2063ec5f15db2bd8bb81f595db0df8d7b6cb4856b62a8f053e27a7fbb"},{"version":"59cfb60c20745629892e5cebdd64810cf65a89de26f74cb35f306a79dbcb2170","signature":"b304ba51159423710c71800c5f37488b50ba38a9234f7da82f63bff311b09a6c"},{"version":"a2a840ac3fc83d8a7b2d449cf1c07c2a2dd48c998f3bec90d86f3827b27c38f9","signature":"99a966edea4ae9c39058b2a855672abb75acbb5ae8ccbc4fdfa15f5973062c1f"},{"version":"dee61459c75434339a6c6272d98d78c0835d299c29f4a8e232c49f92dc29edbf","signature":"dc4116818e8eb610af135323f95002b32ef244b2886265a95a0d5293adf255d3"}],"root":[60,[232,235]],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[65,1],[63,2],[64,3],[220,4],[62,5],[61,6],[229,7],[222,8],[221,9],[223,10],[224,8],[228,11],[170,9],[116,12],[117,12],[118,13],[71,14],[119,15],[120,16],[121,17],[66,9],[69,18],[67,9],[68,9],[122,19],[123,20],[124,21],[125,22],[126,23],[127,24],[128,24],[129,25],[130,26],[131,27],[132,28],[72,9],[70,9],[133,29],[134,30],[135,31],[169,32],[136,33],[137,9],[138,34],[139,35],[140,36],[141,37],[142,38],[143,39],[144,40],[145,41],[146,42],[147,42],[148,43],[149,9],[150,44],[151,45],[153,46],[152,47],[154,48],[155,49],[156,50],[157,51],[158,52],[159,53],[160,54],[161,55],[162,56],[163,57],[164,58],[165,59],[166,60],[73,9],[74,9],[75,9],[113,61],[114,9],[115,9],[167,62],[168,63],[226,9],[177,9],[215,64],[216,9],[218,65],[214,66],[217,67],[211,68],[212,69],[213,70],[219,71],[209,72],[202,9],[203,9],[207,73],[208,74],[204,9],[205,9],[210,9],[206,9],[225,11],[227,75],[194,76],[192,77],[193,78],[181,79],[182,77],[189,80],[180,81],[185,82],[195,9],[186,83],[191,84],[197,85],[196,86],[179,87],[187,88],[188,89],[183,90],[190,76],[184,91],[172,92],[171,93],[178,9],[58,9],[59,9],[10,9],[11,9],[13,9],[12,9],[2,9],[14,9],[15,9],[16,9],[17,9],[18,9],[19,9],[20,9],[21,9],[3,9],[22,9],[23,9],[4,9],[24,9],[28,9],[25,9],[26,9],[27,9],[29,9],[30,9],[31,9],[5,9],[32,9],[33,9],[34,9],[35,9],[6,9],[39,9],[36,9],[37,9],[38,9],[40,9],[7,9],[41,9],[46,9],[47,9],[42,9],[43,9],[44,9],[45,9],[8,9],[51,9],[48,9],[49,9],[50,9],[52,9],[9,9],[53,9],[54,9],[55,9],[57,9],[56,9],[1,9],[91,94],[101,95],[90,94],[111,96],[82,97],[81,98],[110,99],[104,100],[109,101],[84,102],[98,103],[83,104],[107,105],[79,106],[78,99],[108,107],[80,108],[85,109],[86,9],[89,109],[76,9],[112,110],[102,111],[93,112],[94,113],[96,114],[92,115],[95,116],[105,99],[87,117],[88,118],[97,119],[77,120],[100,111],[99,109],[103,9],[106,121],[201,122],[198,123],[176,124],[174,125],[173,9],[175,126],[199,9],[200,127],[231,128],[230,9],[60,44],[235,129],[233,130],[234,131],[232,132]],"latestChangedDtsFile":"./dist/index.d.ts","version":"5.9.3"}
````

## File: packages/testing/src/index.ts
````typescript
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
````

## File: packages/testing/tests/app-loader.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { createTempLitoProject } from "../dist/index.js";
import { loadLitoAppFromManifest } from "../../app/dist/index.js";

test("loadLitoAppFromManifest auto-loads special app pages by convention", async () => {
  const project = createTempLitoProject({
    "app/pages/_index.mjs": "export default { render: () => 'home' };\n",
    "app/pages/_not-found.mjs": "export default { render: () => 'missing' };\n",
    "app/pages/_error.mjs": "export default { render: () => 'error' };\n",
    "app/api/health.mjs": "export function get() { return Response.json({ ok: true }); }\n",
    "app/api/_middleware.mjs": "export default async function middleware(context, next) { context.setLocal(\"fromApiMiddleware\", true); await next(); };\n",
    "src/generated/.gitkeep": ""
  });

  try {
    const manifestBaseUrl = new URL(`file://${project.rootDir}/src/generated/`);
    const app = await loadLitoAppFromManifest({
      manifestBaseUrl,
      pageManifest: [
        {
          page: () => import(new URL("../../app/pages/_index.mjs", manifestBaseUrl).href),
          layouts: [],
          routeId: "index",
          routePath: "/"
        }
      ],
      apiModulePaths: ["../../app/api/health.mjs"],
      notFoundPagePath: "../../app/pages/_not-found.mjs",
      errorPagePath: "../../app/pages/_error.mjs",
      apiMiddlewarePath: "../../app/api/_middleware.mjs"
    });

    assert.equal(app.pages.length, 1);
    assert.equal(app.apiRoutes.length, 1);
    assert.ok(app.notFoundPage);
    assert.ok(app.errorPage);
    assert.equal(app.middlewares.length, 1);
  } finally {
    project.cleanup();
  }
});

test("loadLitoAppFromManifest maps page config.ssr = false to client mode", async () => {
  const project = createTempLitoProject({
    "app/pages/_index.mjs": "export default { config: { ssr: false }, render: () => 'client-home' };\n",
    "src/generated/.gitkeep": ""
  });

  try {
    const manifestBaseUrl = new URL(`file://${project.rootDir}/src/generated/`);
    const app = await loadLitoAppFromManifest({
      manifestBaseUrl,
      pageManifest: [
        {
          page: () => import(new URL("../../app/pages/_index.mjs", manifestBaseUrl).href),
          layouts: [],
          routeId: "index",
          routePath: "/"
        }
      ],
      apiModulePaths: []
    });

    assert.equal(app.pages.length, 1);
    assert.equal(app.pages[0].mode, "client");
  } finally {
    project.cleanup();
  }
});
````

## File: packages/testing/tests/doctor.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { createTempLitoProject } from "../dist/index.js";
import { formatDoctorReport, hasDoctorErrors, runLitoDoctor } from "../../cli/dist/doctor.js";

test("runLitoDoctor reports legacy page filenames and missing conventions", () => {
  const project = createTempLitoProject({
    "app/pages/index.ts": "export default {}\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    const findings = runLitoDoctor(project.rootDir);
    const report = formatDoctorReport(findings);

    assert.equal(hasDoctorErrors(findings), true);
    assert.match(report, /app\/pages\/index\.ts should be moved to app\/pages\/_index\.ts/);
    assert.match(report, /Missing `app\/pages\/_not-found\.ts`/);
    assert.match(report, /Missing `app\/pages\/_error\.ts`/);
    assert.match(report, /No `app\/api\/_middleware\.ts` found/);
  } finally {
    project.cleanup();
  }
});
````

## File: packages/testing/tests/manifest.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createTempLitoProject } from "../dist/index.js";
import { generateRouteManifests } from "../../cli/dist/generate-route-manifests.js";

test("generateRouteManifests writes page and api manifests for folder-based routes", () => {
  const project = createTempLitoProject({
    "app/pages/_index.ts": "export default {}\n",
    "app/pages/docs/_layout.ts": "export default {}\n",
    "app/pages/docs/getting-started/_index.ts": "export default {}\n",
    "app/pages/_not-found.ts": "export default {}\n",
    "app/pages/_error.ts": "export default {}\n",
    "app/api/_middleware.ts": "export default async function middleware(_context, next) { await next(); }\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    generateRouteManifests(project.rootDir);

    const pageManifest = readFileSync(resolve(project.rootDir, "src/generated/page-manifest.ts"), "utf8");
    const apiManifest = readFileSync(resolve(project.rootDir, "src/generated/api-manifest.ts"), "utf8");

    assert.match(pageManifest, /"\.\.\/\.\.\/app\/pages\/_index\.ts"/);
    assert.match(pageManifest, /docs\/getting-started\/_index\.ts/);
    assert.doesNotMatch(pageManifest, /_not-found\.ts/);
    assert.doesNotMatch(pageManifest, /_error\.ts/);
    assert.match(apiManifest, /health\.ts/);
    assert.doesNotMatch(apiManifest, /_middleware\.ts/);
  } finally {
    project.cleanup();
  }
});

test("generateRouteManifests throws when legacy page filenames are present", () => {
  const project = createTempLitoProject({
    "app/pages/dashboard.ts": "export default {}\n",
    "app/api/health.ts": "export function get() { return Response.json({ ok: true }); }\n"
  });

  try {
    assert.throws(
      () => generateRouteManifests(project.rootDir),
      /app\/pages\/dashboard\.ts -> move to app\/pages\/dashboard\/_index\.ts/
    );
  } finally {
    project.cleanup();
  }
});
````

## File: packages/testing/tests/router.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { matchRoutePath, resolveRoute } from "../../router/dist/index.js";

test("matchRoutePath resolves static and dynamic segments", () => {
  assert.deepEqual(matchRoutePath("/products/:id", "/products/42"), {
    params: {
      id: "42"
    },
    pathname: "/products/42"
  });

  assert.equal(matchRoutePath("/products/:id", "/products"), null);
});

test("resolveRoute returns the first matching route", () => {
  const resolved = resolveRoute(
    [
      { id: "home", path: "/" },
      { id: "product", path: "/products/:id" }
    ],
    "/products/99"
  );

  assert.equal(resolved?.route.id, "product");
  assert.deepEqual(resolved?.match.params, {
    id: "99"
  });
});
````

## File: packages/testing/tests/server.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { createLitoServer, defineApiRoute } from "../../server/dist/index.js";

test("createLitoServer renders SSR pages with middleware-provided request locals", async () => {
  const logs = [];
  const app = createLitoServer({
    appName: "Lito Test",
    logger: {
      onRequestStart: ({ pathname }) => {
        logs.push(`start:${pathname}`);
      },
      onRequestComplete: ({ pathname, timing }) => {
        logs.push(`done:${pathname}:${timing.durationMs}`);
      }
    },
    middlewares: [
      async (context, next) => {
        context.setLocal("requestId", "req-123");
        await next();
      }
    ],
    pages: [
      {
        id: "home",
        path: "/",
        load: (context) => ({
          requestId: context.getLocal("requestId"),
          source: context.query.get("source"),
          cookieTheme: context.getCookie("theme"),
          startedAt: context.timing.startedAt
        }),
        document: ({ data }) => ({
          title: `Home ${String(data.requestId)}`
        }),
        render: ({ data }) =>
          `${String(data.requestId)}:${String(data.source)}:${String(data.cookieTheme)}:${typeof data.startedAt}`
      }
    ]
  });

  const response = await app.fetch(
    new Request("http://lito.test/?source=middleware", {
      headers: {
        cookie: "theme=sea"
      }
    })
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(body, /<title>Home req-123<\/title>/);
  assert.match(body, /req-123:middleware:sea:number/);
  assert.match(
    body,
    /window\.__LITO_DATA__=\{"pageData":\{"requestId":"req-123","source":"middleware","cookieTheme":"sea","startedAt":\d+\}\}/
  );
  assert.deepEqual(logs[0], "start:/");
  assert.match(logs[1], /^done:\/:\d+$/);
});

test("createLitoServer renders custom 404 pages", async () => {
  const app = createLitoServer({
    appName: "Lito Test",
    middlewares: [
      (context, next) => {
        context.setLocal("requestId", "missing-404");
        return next();
      }
    ],
    notFoundPage: {
      document: {
        title: "Missing"
      },
      render: (context) => `missing:${String(context.getLocal("requestId"))}`
    },
    pages: [
      {
        id: "home",
        path: "/",
        render: () => "home"
      }
    ]
  });

  const response = await app.fetch(new Request("http://lito.test/unknown"));
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(body, /<title>Missing<\/title>/);
  assert.match(body, /missing:missing-404/);
});

test("createLitoServer renders custom 500 pages and returns JSON for API failures", async () => {
  const app = createLitoServer({
    appName: "Lito Test",
    errorPage: {
      document: ({ status }) => ({
        title: `Error ${status}`
      }),
      render: ({ error, status }) => `${status}:${error instanceof Error ? error.message : "unknown"}`
    },
    pages: [
      {
        id: "boom",
        path: "/boom",
        load: () => {
          throw new Error("page exploded");
        },
        render: () => "never"
      }
    ],
    apiRoutes: [
      {
        id: "api:boom",
        path: "/api/boom",
        get: () => {
          throw new Error("api exploded");
        }
      }
    ]
  });

  const pageResponse = await app.fetch(new Request("http://lito.test/boom"));
  const pageBody = await pageResponse.text();
  const apiResponse = await app.fetch(new Request("http://lito.test/api/boom"));
  const apiBody = await apiResponse.json();

  assert.equal(pageResponse.status, 500);
  assert.match(pageBody, /<title>Error 500<\/title>/);
  assert.match(pageBody, /500:page exploded/);
  assert.deepEqual(apiBody, {
    ok: false,
    error: {
      message: "api exploded"
    }
  });
});

test("defineApiRoute passes typed query data into API handlers", async () => {
  const query = {
    q: "number",
    draft: "boolean",
    tag: "strings"
  };

  const app = createLitoServer({
    appName: "Lito Test",
    apiRoutes: [
      {
        id: "api:products:detail",
        path: "/api/products/:id",
        ...defineApiRoute({
          query,
          get: ({ params, queryData }) =>
            Response.json({
              id: params.id,
              query: queryData
            })
        })
      }
    ]
  });

  const response = await app.fetch(new Request("http://lito.test/api/products/42?q=3&draft=true&tag=a&tag=b"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    id: "42",
    query: {
      q: 3,
      draft: true,
      tag: ["a", "b"]
    }
  });
});
````

## File: packages/testing/tests/state.test.mjs
````javascript
import test from "node:test";
import assert from "node:assert/strict";
import { batch, memo, signal, watch } from "../../core/dist/signals.js";
import { store } from "../../core/dist/store.js";

function flushMicrotasks() {
  return new Promise((resolve) => queueMicrotask(resolve));
}

test("signal updates subscribers and memo values", async () => {
  const count = signal(1);
  const doubled = memo(() => count.get() * 2);
  const observed = [];

  const unsubscribe = doubled.subscribe((value) => {
    observed.push(value);
  });

  assert.equal(doubled.get(), 2);

  count.set(2);
  await flushMicrotasks();

  assert.equal(doubled.get(), 4);
  assert.deepEqual(observed, [4]);

  unsubscribe();
});

test("batch coalesces signal notifications", async () => {
  const count = signal(0);
  const observed = [];

  count.subscribe((value) => {
    observed.push(value);
  });

  batch(() => {
    count.set(1);
    count.set(2);
    count.set(3);
  });
  await flushMicrotasks();

  assert.deepEqual(observed, [3]);
  assert.equal(count.get(), 3);
});

test("watch reruns when dependencies change", async () => {
  const first = signal("Lito");
  const second = signal("Framework");
  const seen = [];

  const stop = watch(() => {
    seen.push(`${first.get()} ${second.get()}`);
  });

  second.set("State");
  first.set("New");
  await flushMicrotasks();

  stop();
  second.set("Ignored");
  await flushMicrotasks();

  assert.deepEqual(seen, ["Lito Framework", "New State"]);
});

test("store supports whole-state and field subscriptions", async () => {
  const profile = store({
    name: "Lito",
    count: 1
  });

  const states = [];
  const counts = [];

  const unsubscribeState = profile.subscribe((state) => {
    states.push(state);
  });
  const unsubscribeCount = profile.subscribe("count", (count) => {
    counts.push(count);
  });

  profile.set("count", 2);
  profile.set({
    name: "Framework",
    count: 3
  });
  await flushMicrotasks();

  unsubscribeState();
  unsubscribeCount();

  assert.deepEqual(states, [
    { name: "Lito", count: 2 },
    { name: "Framework", count: 3 }
  ]);
  assert.deepEqual(counts, [2, 3]);
  assert.equal(profile.get("name"), "Framework");
});
````

## File: packages/testing/package.json
````json
{
  "name": "@lito/testing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist",
    "tests"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test tests/*.test.mjs"
  }
}
````

## File: packages/testing/tsconfig.json
````json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
````

## File: packages/testing/tsconfig.tsbuildinfo
````
{"fileNames":["../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es5.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.dom.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.core.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.collection.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.generator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.iterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.proxy.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.reflect.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2015.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.array.include.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2016.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.arraybuffer.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2017.typedarrays.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asyncgenerator.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.asynciterable.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2018.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.symbol.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2019.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.bigint.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.date.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.sharedmemory.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.symbol.wellknown.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2020.number.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.promise.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.weakref.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2021.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.array.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.error.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.intl.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.object.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.string.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.es2022.regexp.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.d.ts","../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript/lib/lib.decorators.legacy.d.ts","./src/index.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/disposable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/indexable.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/iterators.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/compatibility/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.typedarray.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/globals.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/abortcontroller.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/domexception.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/events.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/header.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/readable.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/file.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/fetch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/formdata.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/connector.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-dispatcher.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/global-origin.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool-stats.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/handlers.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/balanced-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-interceptor.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-client.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-pool.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/mock-errors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/env-http-proxy-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-handler.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/retry-agent.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/api.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/interceptors.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/util.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cookies.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/patch.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/websocket.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/eventsource.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/filereader.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/diagnostics-channel.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/content-type.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/cache.d.ts","../../node_modules/.pnpm/undici-types@6.21.0/node_modules/undici-types/index.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/fetch.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/navigator.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/web-globals/storage.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/assert/strict.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/async_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/buffer.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/child_process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/cluster.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/console.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/constants.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/crypto.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dgram.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/diagnostics_channel.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/dns/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/domain.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/fs/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/http2.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/https.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/inspector.generated.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/module.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/net.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/os.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/path.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/perf_hooks.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/process.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/punycode.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/querystring.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/readline/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/repl.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sea.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/sqlite.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/consumers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/stream/web.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/string_decoder.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/test.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/timers/promises.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tls.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/trace_events.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/tty.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/url.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/util.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/v8.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/vm.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/wasi.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/worker_threads.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/zlib.d.ts","../../node_modules/.pnpm/@types+node@22.19.17/node_modules/@types/node/index.d.ts"],"fileIdsList":[[66,111,112,114,131,132],[66,113,114,131,132],[114,131,132],[66,114,119,131,132,149],[66,114,115,120,125,131,132,134,146,157],[66,114,115,116,125,131,132,134],[66,114,131,132],[61,62,63,66,114,131,132],[66,114,117,131,132,158],[66,114,118,119,126,131,132,135],[66,114,119,131,132,146,154],[66,114,120,122,125,131,132,134],[66,113,114,121,131,132],[66,114,122,123,131,132],[66,114,124,125,131,132],[66,113,114,125,131,132],[66,114,125,126,127,131,132,146,157],[66,114,125,126,127,131,132,141,146,149],[66,107,114,122,125,128,131,132,134,146,157],[66,114,125,126,128,129,131,132,134,146,154,157],[66,114,128,130,131,132,146,154,157],[64,65,66,67,68,69,70,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163],[66,114,125,131,132],[66,114,131,132,133,157],[66,114,122,125,131,132,134,146],[66,114,131,132,135],[66,114,131,132,136],[66,113,114,131,132,137],[66,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163],[66,114,131,132,139],[66,114,131,132,140],[66,114,125,131,132,141,142],[66,114,131,132,141,143,158,160],[66,114,126,131,132],[66,114,125,131,132,146,147,149],[66,114,131,132,148,149],[66,114,131,132,146,147],[66,114,131,132,149],[66,114,131,132,150],[66,111,114,131,132,146,151,157],[66,114,125,131,132,152,153],[66,114,131,132,152,153],[66,114,119,131,132,134,146,154],[66,114,131,132,155],[66,114,131,132,134,156],[66,114,128,131,132,140,157],[66,114,119,131,132,158],[66,114,131,132,146,159],[66,114,131,132,133,160],[66,114,131,132,161],[66,107,114,131,132],[66,107,114,125,127,131,132,137,146,149,157,159,160,162],[66,114,131,132,146,163],[66,79,83,114,131,132,157],[66,79,114,131,132,146,157],[66,74,114,131,132],[66,76,79,114,131,132,154,157],[66,114,131,132,134,154],[66,114,131,132,164],[66,74,114,131,132,164],[66,76,79,114,131,132,134,157],[66,71,72,75,78,114,125,131,132,146,157],[66,79,86,114,131,132],[66,71,77,114,131,132],[66,79,100,101,114,131,132],[66,75,79,114,131,132,149,157,164],[66,100,114,131,132,164],[66,73,74,114,131,132,164],[66,79,114,131,132],[66,73,74,75,76,77,78,79,80,81,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,101,102,103,104,105,106,114,131,132],[66,79,94,114,131,132],[66,79,86,87,114,131,132],[66,77,79,87,88,114,131,132],[66,78,114,131,132],[66,71,74,79,114,131,132],[66,79,83,87,88,114,131,132],[66,83,114,131,132],[66,77,79,82,114,131,132,157],[66,71,76,79,86,114,131,132],[66,114,131,132,146],[66,74,79,100,114,131,132,162,164],[66,114,126,131,132,135,136]],"fileInfos":[{"version":"c430d44666289dae81f30fa7b2edebf186ecc91a2d4c71266ea6ae76388792e1","affectsGlobalScope":true,"impliedFormat":1},{"version":"45b7ab580deca34ae9729e97c13cfd999df04416a79116c3bfb483804f85ded4","impliedFormat":1},{"version":"3facaf05f0c5fc569c5649dd359892c98a85557e3e0c847964caeb67076f4d75","impliedFormat":1},{"version":"e44bb8bbac7f10ecc786703fe0a6a4b952189f908707980ba8f3c8975a760962","impliedFormat":1},{"version":"5e1c4c362065a6b95ff952c0eab010f04dcd2c3494e813b493ecfd4fcb9fc0d8","impliedFormat":1},{"version":"68d73b4a11549f9c0b7d352d10e91e5dca8faa3322bfb77b661839c42b1ddec7","impliedFormat":1},{"version":"5efce4fc3c29ea84e8928f97adec086e3dc876365e0982cc8479a07954a3efd4","impliedFormat":1},{"version":"feecb1be483ed332fad555aff858affd90a48ab19ba7272ee084704eb7167569","impliedFormat":1},{"version":"ee7bad0c15b58988daa84371e0b89d313b762ab83cb5b31b8a2d1162e8eb41c2","impliedFormat":1},{"version":"080941d9f9ff9307f7e27a83bcd888b7c8270716c39af943532438932ec1d0b9","affectsGlobalScope":true,"impliedFormat":1},{"version":"2e80ee7a49e8ac312cc11b77f1475804bee36b3b2bc896bead8b6e1266befb43","affectsGlobalScope":true,"impliedFormat":1},{"version":"c57796738e7f83dbc4b8e65132f11a377649c00dd3eee333f672b8f0a6bea671","affectsGlobalScope":true,"impliedFormat":1},{"version":"dc2df20b1bcdc8c2d34af4926e2c3ab15ffe1160a63e58b7e09833f616efff44","affectsGlobalScope":true,"impliedFormat":1},{"version":"515d0b7b9bea2e31ea4ec968e9edd2c39d3eebf4a2d5cbd04e88639819ae3b71","affectsGlobalScope":true,"impliedFormat":1},{"version":"0559b1f683ac7505ae451f9a96ce4c3c92bdc71411651ca6ddb0e88baaaad6a3","affectsGlobalScope":true,"impliedFormat":1},{"version":"0dc1e7ceda9b8b9b455c3a2d67b0412feab00bd2f66656cd8850e8831b08b537","affectsGlobalScope":true,"impliedFormat":1},{"version":"ce691fb9e5c64efb9547083e4a34091bcbe5bdb41027e310ebba8f7d96a98671","affectsGlobalScope":true,"impliedFormat":1},{"version":"8d697a2a929a5fcb38b7a65594020fcef05ec1630804a33748829c5ff53640d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"4ff2a353abf8a80ee399af572debb8faab2d33ad38c4b4474cff7f26e7653b8d","affectsGlobalScope":true,"impliedFormat":1},{"version":"fb0f136d372979348d59b3f5020b4cdb81b5504192b1cacff5d1fbba29378aa1","affectsGlobalScope":true,"impliedFormat":1},{"version":"d15bea3d62cbbdb9797079416b8ac375ae99162a7fba5de2c6c505446486ac0a","affectsGlobalScope":true,"impliedFormat":1},{"version":"68d18b664c9d32a7336a70235958b8997ebc1c3b8505f4f1ae2b7e7753b87618","affectsGlobalScope":true,"impliedFormat":1},{"version":"eb3d66c8327153d8fa7dd03f9c58d351107fe824c79e9b56b462935176cdf12a","affectsGlobalScope":true,"impliedFormat":1},{"version":"38f0219c9e23c915ef9790ab1d680440d95419ad264816fa15009a8851e79119","affectsGlobalScope":true,"impliedFormat":1},{"version":"69ab18c3b76cd9b1be3d188eaf8bba06112ebbe2f47f6c322b5105a6fbc45a2e","affectsGlobalScope":true,"impliedFormat":1},{"version":"a680117f487a4d2f30ea46f1b4b7f58bef1480456e18ba53ee85c2746eeca012","affectsGlobalScope":true,"impliedFormat":1},{"version":"2f11ff796926e0832f9ae148008138ad583bd181899ab7dd768a2666700b1893","affectsGlobalScope":true,"impliedFormat":1},{"version":"4de680d5bb41c17f7f68e0419412ca23c98d5749dcaaea1896172f06435891fc","affectsGlobalScope":true,"impliedFormat":1},{"version":"954296b30da6d508a104a3a0b5d96b76495c709785c1d11610908e63481ee667","affectsGlobalScope":true,"impliedFormat":1},{"version":"ac9538681b19688c8eae65811b329d3744af679e0bdfa5d842d0e32524c73e1c","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a969edff4bd52585473d24995c5ef223f6652d6ef46193309b3921d65dd4376","affectsGlobalScope":true,"impliedFormat":1},{"version":"9e9fbd7030c440b33d021da145d3232984c8bb7916f277e8ffd3dc2e3eae2bdb","affectsGlobalScope":true,"impliedFormat":1},{"version":"811ec78f7fefcabbda4bfa93b3eb67d9ae166ef95f9bff989d964061cbf81a0c","affectsGlobalScope":true,"impliedFormat":1},{"version":"717937616a17072082152a2ef351cb51f98802fb4b2fdabd32399843875974ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"d7e7d9b7b50e5f22c915b525acc5a49a7a6584cf8f62d0569e557c5cfc4b2ac2","affectsGlobalScope":true,"impliedFormat":1},{"version":"71c37f4c9543f31dfced6c7840e068c5a5aacb7b89111a4364b1d5276b852557","affectsGlobalScope":true,"impliedFormat":1},{"version":"576711e016cf4f1804676043e6a0a5414252560eb57de9faceee34d79798c850","affectsGlobalScope":true,"impliedFormat":1},{"version":"89c1b1281ba7b8a96efc676b11b264de7a8374c5ea1e6617f11880a13fc56dc6","affectsGlobalScope":true,"impliedFormat":1},{"version":"74f7fa2d027d5b33eb0471c8e82a6c87216223181ec31247c357a3e8e2fddc5b","affectsGlobalScope":true,"impliedFormat":1},{"version":"d6d7ae4d1f1f3772e2a3cde568ed08991a8ae34a080ff1151af28b7f798e22ca","affectsGlobalScope":true,"impliedFormat":1},{"version":"063600664504610fe3e99b717a1223f8b1900087fab0b4cad1496a114744f8df","affectsGlobalScope":true,"impliedFormat":1},{"version":"934019d7e3c81950f9a8426d093458b65d5aff2c7c1511233c0fd5b941e608ab","affectsGlobalScope":true,"impliedFormat":1},{"version":"52ada8e0b6e0482b728070b7639ee42e83a9b1c22d205992756fe020fd9f4a47","affectsGlobalScope":true,"impliedFormat":1},{"version":"3bdefe1bfd4d6dee0e26f928f93ccc128f1b64d5d501ff4a8cf3c6371200e5e6","affectsGlobalScope":true,"impliedFormat":1},{"version":"59fb2c069260b4ba00b5643b907ef5d5341b167e7d1dbf58dfd895658bda2867","affectsGlobalScope":true,"impliedFormat":1},{"version":"639e512c0dfc3fad96a84caad71b8834d66329a1f28dc95e3946c9b58176c73a","affectsGlobalScope":true,"impliedFormat":1},{"version":"368af93f74c9c932edd84c58883e736c9e3d53cec1fe24c0b0ff451f529ceab1","affectsGlobalScope":true,"impliedFormat":1},{"version":"af3dd424cf267428f30ccfc376f47a2c0114546b55c44d8c0f1d57d841e28d74","affectsGlobalScope":true,"impliedFormat":1},{"version":"995c005ab91a498455ea8dfb63aa9f83fa2ea793c3d8aa344be4a1678d06d399","affectsGlobalScope":true,"impliedFormat":1},{"version":"959d36cddf5e7d572a65045b876f2956c973a586da58e5d26cde519184fd9b8a","affectsGlobalScope":true,"impliedFormat":1},{"version":"965f36eae237dd74e6cca203a43e9ca801ce38824ead814728a2807b1910117d","affectsGlobalScope":true,"impliedFormat":1},{"version":"3925a6c820dcb1a06506c90b1577db1fdbf7705d65b62b99dce4be75c637e26b","affectsGlobalScope":true,"impliedFormat":1},{"version":"0a3d63ef2b853447ec4f749d3f368ce642264246e02911fcb1590d8c161b8005","affectsGlobalScope":true,"impliedFormat":1},{"version":"8cdf8847677ac7d20486e54dd3fcf09eda95812ac8ace44b4418da1bbbab6eb8","affectsGlobalScope":true,"impliedFormat":1},{"version":"8444af78980e3b20b49324f4a16ba35024fef3ee069a0eb67616ea6ca821c47a","affectsGlobalScope":true,"impliedFormat":1},{"version":"3287d9d085fbd618c3971944b65b4be57859f5415f495b33a6adc994edd2f004","affectsGlobalScope":true,"impliedFormat":1},{"version":"b4b67b1a91182421f5df999988c690f14d813b9850b40acd06ed44691f6727ad","affectsGlobalScope":true,"impliedFormat":1},{"version":"8e7f8264d0fb4c5339605a15daadb037bf238c10b654bb3eee14208f860a32ea","affectsGlobalScope":true,"impliedFormat":1},{"version":"782dec38049b92d4e85c1585fbea5474a219c6984a35b004963b00beb1aab538","affectsGlobalScope":true,"impliedFormat":1},{"version":"87688e06791c06132476d8eb94ff12da16a6299b3522c8fdda645760aa775374","signature":"16922997cfcc10ce5c1938f49029f72eb99484e7e2473bd6f659bb4bec34c6c2"},{"version":"6c7176368037af28cb72f2392010fa1cef295d6d6744bca8cfb54985f3a18c3e","affectsGlobalScope":true,"impliedFormat":1},{"version":"ab41ef1f2cdafb8df48be20cd969d875602483859dc194e9c97c8a576892c052","affectsGlobalScope":true,"impliedFormat":1},{"version":"437e20f2ba32abaeb7985e0afe0002de1917bc74e949ba585e49feba65da6ca1","affectsGlobalScope":true,"impliedFormat":1},{"version":"21d819c173c0cf7cc3ce57c3276e77fd9a8a01d35a06ad87158781515c9a438a","impliedFormat":1},{"version":"98cffbf06d6bab333473c70a893770dbe990783904002c4f1a960447b4b53dca","affectsGlobalScope":true,"impliedFormat":1},{"version":"3af97acf03cc97de58a3a4bc91f8f616408099bc4233f6d0852e72a8ffb91ac9","affectsGlobalScope":true,"impliedFormat":1},{"version":"808069bba06b6768b62fd22429b53362e7af342da4a236ed2d2e1c89fcca3b4a","affectsGlobalScope":true,"impliedFormat":1},{"version":"1db0b7dca579049ca4193d034d835f6bfe73096c73663e5ef9a0b5779939f3d0","affectsGlobalScope":true,"impliedFormat":1},{"version":"9798340ffb0d067d69b1ae5b32faa17ab31b82466a3fc00d8f2f2df0c8554aaa","affectsGlobalScope":true,"impliedFormat":1},{"version":"f26b11d8d8e4b8028f1c7d618b22274c892e4b0ef5b3678a8ccbad85419aef43","affectsGlobalScope":true,"impliedFormat":1},{"version":"5929864ce17fba74232584d90cb721a89b7ad277220627cc97054ba15a98ea8f","impliedFormat":1},{"version":"763fe0f42b3d79b440a9b6e51e9ba3f3f91352469c1e4b3b67bfa4ff6352f3f4","impliedFormat":1},{"version":"25c8056edf4314820382a5fdb4bb7816999acdcb929c8f75e3f39473b87e85bc","impliedFormat":1},{"version":"c464d66b20788266e5353b48dc4aa6bc0dc4a707276df1e7152ab0c9ae21fad8","impliedFormat":1},{"version":"78d0d27c130d35c60b5e5566c9f1e5be77caf39804636bc1a40133919a949f21","impliedFormat":1},{"version":"c6fd2c5a395f2432786c9cb8deb870b9b0e8ff7e22c029954fabdd692bff6195","impliedFormat":1},{"version":"1d6e127068ea8e104a912e42fc0a110e2aa5a66a356a917a163e8cf9a65e4a75","impliedFormat":1},{"version":"5ded6427296cdf3b9542de4471d2aa8d3983671d4cac0f4bf9c637208d1ced43","impliedFormat":1},{"version":"7f182617db458e98fc18dfb272d40aa2fff3a353c44a89b2c0ccb3937709bfb5","impliedFormat":1},{"version":"cadc8aced301244057c4e7e73fbcae534b0f5b12a37b150d80e5a45aa4bebcbd","impliedFormat":1},{"version":"385aab901643aa54e1c36f5ef3107913b10d1b5bb8cbcd933d4263b80a0d7f20","impliedFormat":1},{"version":"9670d44354bab9d9982eca21945686b5c24a3f893db73c0dae0fd74217a4c219","impliedFormat":1},{"version":"0b8a9268adaf4da35e7fa830c8981cfa22adbbe5b3f6f5ab91f6658899e657a7","impliedFormat":1},{"version":"11396ed8a44c02ab9798b7dca436009f866e8dae3c9c25e8c1fbc396880bf1bb","impliedFormat":1},{"version":"ba7bc87d01492633cb5a0e5da8a4a42a1c86270e7b3d2dea5d156828a84e4882","impliedFormat":1},{"version":"4893a895ea92c85345017a04ed427cbd6a1710453338df26881a6019432febdd","impliedFormat":1},{"version":"c21dc52e277bcfc75fac0436ccb75c204f9e1b3fa5e12729670910639f27343e","impliedFormat":1},{"version":"13f6f39e12b1518c6650bbb220c8985999020fe0f21d818e28f512b7771d00f9","impliedFormat":1},{"version":"9b5369969f6e7175740bf51223112ff209f94ba43ecd3bb09eefff9fd675624a","impliedFormat":1},{"version":"4fe9e626e7164748e8769bbf74b538e09607f07ed17c2f20af8d680ee49fc1da","impliedFormat":1},{"version":"24515859bc0b836719105bb6cc3d68255042a9f02a6022b3187948b204946bd2","impliedFormat":1},{"version":"ea0148f897b45a76544ae179784c95af1bd6721b8610af9ffa467a518a086a43","impliedFormat":1},{"version":"24c6a117721e606c9984335f71711877293a9651e44f59f3d21c1ea0856f9cc9","impliedFormat":1},{"version":"dd3273ead9fbde62a72949c97dbec2247ea08e0c6952e701a483d74ef92d6a17","impliedFormat":1},{"version":"405822be75ad3e4d162e07439bac80c6bcc6dbae1929e179cf467ec0b9ee4e2e","impliedFormat":1},{"version":"0db18c6e78ea846316c012478888f33c11ffadab9efd1cc8bcc12daded7a60b6","impliedFormat":1},{"version":"e61be3f894b41b7baa1fbd6a66893f2579bfad01d208b4ff61daef21493ef0a8","impliedFormat":1},{"version":"bd0532fd6556073727d28da0edfd1736417a3f9f394877b6d5ef6ad88fba1d1a","impliedFormat":1},{"version":"89167d696a849fce5ca508032aabfe901c0868f833a8625d5a9c6e861ef935d2","impliedFormat":1},{"version":"615ba88d0128ed16bf83ef8ccbb6aff05c3ee2db1cc0f89ab50a4939bfc1943f","impliedFormat":1},{"version":"a4d551dbf8746780194d550c88f26cf937caf8d56f102969a110cfaed4b06656","impliedFormat":1},{"version":"8bd86b8e8f6a6aa6c49b71e14c4ffe1211a0e97c80f08d2c8cc98838006e4b88","impliedFormat":1},{"version":"317e63deeb21ac07f3992f5b50cdca8338f10acd4fbb7257ebf56735bf52ab00","impliedFormat":1},{"version":"4732aec92b20fb28c5fe9ad99521fb59974289ed1e45aecb282616202184064f","impliedFormat":1},{"version":"2e85db9e6fd73cfa3d7f28e0ab6b55417ea18931423bd47b409a96e4a169e8e6","impliedFormat":1},{"version":"c46e079fe54c76f95c67fb89081b3e399da2c7d109e7dca8e4b58d83e332e605","impliedFormat":1},{"version":"bf67d53d168abc1298888693338cb82854bdb2e69ef83f8a0092093c2d562107","impliedFormat":1},{"version":"b52476feb4a0cbcb25e5931b930fc73cb6643fb1a5060bf8a3dda0eeae5b4b68","affectsGlobalScope":true,"impliedFormat":1},{"version":"f9501cc13ce624c72b61f12b3963e84fad210fbdf0ffbc4590e08460a3f04eba","affectsGlobalScope":true,"impliedFormat":1},{"version":"e7721c4f69f93c91360c26a0a84ee885997d748237ef78ef665b153e622b36c1","affectsGlobalScope":true,"impliedFormat":1},{"version":"0fa06ada475b910e2106c98c68b10483dc8811d0c14a8a8dd36efb2672485b29","impliedFormat":1},{"version":"33e5e9aba62c3193d10d1d33ae1fa75c46a1171cf76fef750777377d53b0303f","impliedFormat":1},{"version":"2b06b93fd01bcd49d1a6bd1f9b65ddcae6480b9a86e9061634d6f8e354c1468f","impliedFormat":1},{"version":"6a0cd27e5dc2cfbe039e731cf879d12b0e2dded06d1b1dedad07f7712de0d7f4","affectsGlobalScope":true,"impliedFormat":1},{"version":"13f5c844119c43e51ce777c509267f14d6aaf31eafb2c2b002ca35584cd13b29","impliedFormat":1},{"version":"e60477649d6ad21542bd2dc7e3d9ff6853d0797ba9f689ba2f6653818999c264","impliedFormat":1},{"version":"c2510f124c0293ab80b1777c44d80f812b75612f297b9857406468c0f4dafe29","affectsGlobalScope":true,"impliedFormat":1},{"version":"5524481e56c48ff486f42926778c0a3cce1cc85dc46683b92b1271865bcf015a","impliedFormat":1},{"version":"4c829ab315f57c5442c6667b53769975acbf92003a66aef19bce151987675bd1","affectsGlobalScope":true,"impliedFormat":1},{"version":"b2ade7657e2db96d18315694789eff2ddd3d8aea7215b181f8a0b303277cc579","impliedFormat":1},{"version":"9855e02d837744303391e5623a531734443a5f8e6e8755e018c41d63ad797db2","impliedFormat":1},{"version":"4d631b81fa2f07a0e63a9a143d6a82c25c5f051298651a9b69176ba28930756d","impliedFormat":1},{"version":"836a356aae992ff3c28a0212e3eabcb76dd4b0cc06bcb9607aeef560661b860d","impliedFormat":1},{"version":"1e0d1f8b0adfa0b0330e028c7941b5a98c08b600efe7f14d2d2a00854fb2f393","impliedFormat":1},{"version":"41670ee38943d9cbb4924e436f56fc19ee94232bc96108562de1a734af20dc2c","affectsGlobalScope":true,"impliedFormat":1},{"version":"c906fb15bd2aabc9ed1e3f44eb6a8661199d6c320b3aa196b826121552cb3695","impliedFormat":1},{"version":"22295e8103f1d6d8ea4b5d6211e43421fe4564e34d0dd8e09e520e452d89e659","impliedFormat":1},{"version":"58647d85d0f722a1ce9de50955df60a7489f0593bf1a7015521efe901c06d770","impliedFormat":1},{"version":"6b4e081d55ac24fc8a4631d5dd77fe249fa25900abd7d046abb87d90e3b45645","impliedFormat":1},{"version":"a10f0e1854f3316d7ee437b79649e5a6ae3ae14ffe6322b02d4987071a95362e","impliedFormat":1},{"version":"e208f73ef6a980104304b0d2ca5f6bf1b85de6009d2c7e404028b875020fa8f2","impliedFormat":1},{"version":"d163b6bc2372b4f07260747cbc6c0a6405ab3fbcea3852305e98ac43ca59f5bc","impliedFormat":1},{"version":"e6fa9ad47c5f71ff733744a029d1dc472c618de53804eae08ffc243b936f87ff","affectsGlobalScope":true,"impliedFormat":1},{"version":"a6f137d651076822d4fe884287e68fd61785a0d3d1fdb250a5059b691fa897db","impliedFormat":1},{"version":"24826ed94a78d5c64bd857570fdbd96229ad41b5cb654c08d75a9845e3ab7dde","impliedFormat":1},{"version":"8b479a130ccb62e98f11f136d3ac80f2984fdc07616516d29881f3061f2dd472","impliedFormat":1},{"version":"928af3d90454bf656a52a48679f199f64c1435247d6189d1caf4c68f2eaf921f","affectsGlobalScope":true,"impliedFormat":1},{"version":"bceb58df66ab8fb00170df20cd813978c5ab84be1d285710c4eb005d8e9d8efb","affectsGlobalScope":true,"impliedFormat":1},{"version":"3f16a7e4deafa527ed9995a772bb380eb7d3c2c0fd4ae178c5263ed18394db2c","impliedFormat":1},{"version":"933921f0bb0ec12ef45d1062a1fc0f27635318f4d294e4d99de9a5493e618ca2","impliedFormat":1},{"version":"71a0f3ad612c123b57239a7749770017ecfe6b66411488000aba83e4546fde25","impliedFormat":1},{"version":"77fbe5eecb6fac4b6242bbf6eebfc43e98ce5ccba8fa44e0ef6a95c945ff4d98","impliedFormat":1},{"version":"4f9d8ca0c417b67b69eeb54c7ca1bedd7b56034bb9bfd27c5d4f3bc4692daca7","impliedFormat":1},{"version":"814118df420c4e38fe5ae1b9a3bafb6e9c2aa40838e528cde908381867be6466","impliedFormat":1},{"version":"a3fc63c0d7b031693f665f5494412ba4b551fe644ededccc0ab5922401079c95","impliedFormat":1},{"version":"80523c00b8544a2000ae0143e4a90a00b47f99823eb7926c1e03c494216fc363","impliedFormat":1},{"version":"37ba7b45141a45ce6e80e66f2a96c8a5ab1bcef0fc2d0f56bb58df96ec67e972","impliedFormat":1},{"version":"45650f47bfb376c8a8ed39d4bcda5902ab899a3150029684ee4c10676d9fbaee","impliedFormat":1},{"version":"746911b62b329587939560deb5c036aca48aece03147b021fa680223255d5183","affectsGlobalScope":true,"impliedFormat":1},{"version":"18fd40412d102c5564136f29735e5d1c3b455b8a37f920da79561f1fde068208","impliedFormat":1},{"version":"c8d3e5a18ba35629954e48c4cc8f11dc88224650067a172685c736b27a34a4dc","impliedFormat":1},{"version":"f0be1b8078cd549d91f37c30c222c2a187ac1cf981d994fb476a1adc61387b14","affectsGlobalScope":true,"impliedFormat":1},{"version":"0aaed1d72199b01234152f7a60046bc947f1f37d78d182e9ae09c4289e06a592","impliedFormat":1},{"version":"2b55d426ff2b9087485e52ac4bc7cfafe1dc420fc76dad926cd46526567c501a","impliedFormat":1},{"version":"66ba1b2c3e3a3644a1011cd530fb444a96b1b2dfe2f5e837a002d41a1a799e60","impliedFormat":1},{"version":"7e514f5b852fdbc166b539fdd1f4e9114f29911592a5eb10a94bb3a13ccac3c4","impliedFormat":1},{"version":"5b7aa3c4c1a5d81b411e8cb302b45507fea9358d3569196b27eb1a27ae3a90ef","affectsGlobalScope":true,"impliedFormat":1},{"version":"5987a903da92c7462e0b35704ce7da94d7fdc4b89a984871c0e2b87a8aae9e69","affectsGlobalScope":true,"impliedFormat":1},{"version":"ea08a0345023ade2b47fbff5a76d0d0ed8bff10bc9d22b83f40858a8e941501c","impliedFormat":1},{"version":"47613031a5a31510831304405af561b0ffaedb734437c595256bb61a90f9311b","impliedFormat":1},{"version":"ae062ce7d9510060c5d7e7952ae379224fb3f8f2dd74e88959878af2057c143b","impliedFormat":1},{"version":"8a1a0d0a4a06a8d278947fcb66bf684f117bf147f89b06e50662d79a53be3e9f","affectsGlobalScope":true,"impliedFormat":1},{"version":"358765d5ea8afd285d4fd1532e78b88273f18cb3f87403a9b16fef61ac9fdcfe","impliedFormat":1},{"version":"9f55299850d4f0921e79b6bf344b47c420ce0f507b9dcf593e532b09ea7eeea1","impliedFormat":1}],"root":[60],"options":{"composite":true,"declaration":true,"esModuleInterop":true,"experimentalDecorators":true,"module":99,"outDir":"./dist","rootDir":"./src","skipLibCheck":true,"sourceMap":true,"strict":true,"target":9,"useDefineForClassFields":false},"referencedMap":[[111,1],[112,1],[113,2],[66,3],[114,4],[115,5],[116,6],[61,7],[64,8],[62,7],[63,7],[117,9],[118,10],[119,11],[120,12],[121,13],[122,14],[123,14],[124,15],[125,16],[126,17],[127,18],[67,7],[65,7],[128,19],[129,20],[130,21],[164,22],[131,23],[132,7],[133,24],[134,25],[135,26],[136,27],[137,28],[138,29],[139,30],[140,31],[141,32],[142,32],[143,33],[144,7],[145,34],[146,35],[148,36],[147,37],[149,38],[150,39],[151,40],[152,41],[153,42],[154,43],[155,44],[156,45],[157,46],[158,47],[159,48],[160,49],[161,50],[68,7],[69,7],[70,7],[108,51],[109,7],[110,7],[162,52],[163,53],[58,7],[59,7],[10,7],[11,7],[13,7],[12,7],[2,7],[14,7],[15,7],[16,7],[17,7],[18,7],[19,7],[20,7],[21,7],[3,7],[22,7],[23,7],[4,7],[24,7],[28,7],[25,7],[26,7],[27,7],[29,7],[30,7],[31,7],[5,7],[32,7],[33,7],[34,7],[35,7],[6,7],[39,7],[36,7],[37,7],[38,7],[40,7],[7,7],[41,7],[46,7],[47,7],[42,7],[43,7],[44,7],[45,7],[8,7],[51,7],[48,7],[49,7],[50,7],[52,7],[9,7],[53,7],[54,7],[55,7],[57,7],[56,7],[1,7],[86,54],[96,55],[85,54],[106,56],[77,57],[76,58],[105,59],[99,60],[104,61],[79,62],[93,63],[78,64],[102,65],[74,66],[73,59],[103,67],[75,68],[80,69],[81,7],[84,69],[71,7],[107,70],[97,71],[88,72],[89,73],[91,74],[87,75],[90,76],[100,59],[82,77],[83,78],[92,79],[72,80],[95,71],[94,69],[98,7],[101,81],[60,82]],"latestChangedDtsFile":"./dist/index.d.ts","version":"5.9.3"}
````

## File: planning/PLANNING.md
````markdown
# Lito Framework Planning

## 1. Vision

Lito คือ Full-stack Framework ที่ออกแบบมาเพื่อใช้มาตรฐาน Web Components เป็นแกนหลักของฝั่ง Frontend โดยมี `Lit` เป็นหัวใจในการสร้าง UI ที่เบา เร็ว และใกล้เคียงมาตรฐานเว็บมากที่สุด ขณะเดียวกันฝั่ง Backend จะทำหน้าที่เป็น Runtime สำหรับ API, SSR, Routing และการเชื่อมต่อข้อมูลแบบครบวงจร เพื่อให้ประสบการณ์การพัฒนาอยู่ในรูปแบบ "framework เดียวจบ" ไม่ต้องประกอบหลายชิ้นเองทุกครั้ง

เป้าหมายของ Lito ไม่ใช่แค่เป็นเครื่องมือสำหรับ render component แต่คือการสร้าง developer experience ที่ชัดเจน เรียบง่าย และต่อยอดได้จริงในงาน production โดยเฉพาะงานที่ต้องการ:

- ประสิทธิภาพสูง
- ขนาด bundle เล็ก
- รองรับ SSR และ SEO
- มี file-based routing
- เชื่อม frontend กับ backend อย่างเป็นระบบ
- เอื้อต่อการทดสอบตั้งแต่ระดับ unit ไปจนถึง integration

## 2. Product Principles

Lito ควรยึดหลักการต่อไปนี้ตั้งแต่วันแรก:

- Web Standards First: ใช้มาตรฐานเว็บเป็นแกน เช่น Custom Elements, Shadow DOM, ES Modules
- Performance by Default: SSR, selective hydration, lazy loading และ build output ต้องถูกออกแบบมาเพื่อความเร็วตั้งแต่ต้น
- Full-stack by Design: Frontend, API, SSR, routing และ data loading ต้องถูกเชื่อมเป็นระบบเดียว
- Convention over Configuration: ใช้โครงสร้างไฟล์และ convention เพื่อลดงาน config ที่ซ้ำซาก
- Testability First: ทุก layer ต้องออกแบบให้ทดสอบได้ง่าย
- Incremental Adoption: แม้เป้าหมายจะเป็น full-stack framework แต่แต่ละส่วนควรถูกแยกเป็น package ที่สามารถพัฒนาและทดสอบได้อิสระ

## 3. High-level Architecture

Lito ควรถูกแบ่งเป็น 4 แกนหลัก:

### 3.1 Frontend Core

ใช้ `Lit` เป็นระบบ component หลัก โดยสร้าง abstraction บางส่วนเพื่อทำให้การพัฒนาใน Lito มีมาตรฐานเดียวกัน เช่น:

- `BaseComponent` ที่ extend จาก `LitElement`
- lifecycle utility สำหรับ async data
- context / dependency injection
- state primitives สำหรับ shared state
- helper สำหรับ client hydration

หน้าที่ของ frontend core:

- กำหนดรูปแบบ component มาตรฐานของ framework
- จัดการ reactive UI
- รองรับ page component และ reusable component
- เชื่อมต่อกับ route data และ server data ได้ง่าย

### 3.2 Backend Core

รันบน `Node.js` หรือ `Bun` โดยในระยะแรกแนะนำให้เริ่มจาก Node.js เพื่อ ecosystem ที่นิ่งกว่า และค่อยออกแบบ abstraction ให้รองรับ Bun ได้ภายหลัง

หน้าที่หลักของ backend core:

- HTTP server runtime
- API routing
- page routing
- server-side rendering
- middleware system
- request/response context
- asset serving และ production build integration

ตัวเลือกเริ่มต้นที่เหมาะสม:

- HTTP framework: `Hono` หรือ `Express`
- SSR integration: `@lit-labs/ssr`
- build/runtime coordination: `Vite`

ข้อเสนอแนะ:

- ระยะแรกเริ่มด้วย `Hono` จะเหมาะกว่าเพราะโครงสร้างเล็กและทันสมัย
- ถ้าต้องการฐานผู้ใช้ที่คุ้นเคยมากขึ้นสามารถทำ adapter สำหรับ Express ในอนาคต

### 3.3 App Bridge

ส่วนนี้คือหัวใจของการทำให้ Lito เป็น "framework" จริง ไม่ใช่แค่การเอา Lit มาวางคู่กับ server

ความสามารถหลัก:

- file-based routing จากโฟลเดอร์ `pages/`
- route manifest generation
- server data loading
- page metadata เช่น title, meta, headers
- shared contract ระหว่าง server กับ page component
- error boundary / not found handling

App Bridge เป็นตัวกำหนดว่าหน้าแต่ละหน้าจะ:

- match route อย่างไร
- preload data อย่างไร
- render แบบ SSR อย่างไร
- hydrate ฝั่ง client อย่างไร

### 3.4 Developer Tooling

Framework จะใช้จริงได้ต้องมี tooling ที่ช่วยลดงาน manual:

- CLI เช่น `lito new`, `lito dev`, `lito build`
- template/scaffolding
- automatic route generation
- dev server integration
- test setup
- production bundling

## 4. Proposed Package Structure

เมื่อ Lito เริ่มเติบโต ควรแยกเป็น monorepo หรืออย่างน้อยคิดแบบ package-first ตั้งแต่ต้น ตัวอย่างโครงสร้าง:

```txt
lito/
  planning/
    PLANNING.md
  packages/
    core/                # BaseComponent, state, context, core frontend utilities
    router/              # file-based routing, route manifest, navigation
    server/              # HTTP runtime, SSR integration, request context
    ssr/                 # Lit SSR adapters / renderer
    cli/                 # scaffolding and developer commands
    build/               # Vite integration, build orchestration
    testing/             # test helpers, mocks, integration test utilities
  playground/
    demo-app/            # app สำหรับทดลอง framework จริง
  docs/
    architecture/
    guides/
```

ถ้าอยากเริ่มแบบเล็กก่อน สามารถใช้โครงสร้างนี้ในเฟสแรก:

```txt
lito/
  planning/
    PLANNING.md
  src/
    core/
    server/
    router/
    cli/
  playground/
```

## 5. Frontend Design Detail

### 5.1 Base Component

ควรมีคลาสกลาง เช่น `LitoElement` ที่ extend จาก `LitElement` เพื่อรวมความสามารถพื้นฐานของ framework:

- access context
- access route data
- shared error handling
- helper สำหรับ loading / async states
- registration pattern ที่ชัดเจน

ตัวอย่างแนวคิด:

- ทุก page component และ app-level component ใช้มาตรฐานเดียวกัน
- ช่วยลดการเขียน boilerplate ซ้ำ
- เป็นจุดรวมสำหรับ plugin หรือ hook ในอนาคต

### 5.2 State Management

Lit ไม่มี global state ในตัว จึงควรออกแบบ state layer ที่เล็กและตรงกับเป้าหมายของ framework มากกว่าการยัด state management ขนาดใหญ่ตั้งแต่ต้น

แนวทางที่เหมาะ:

- เริ่มจาก simple signal/store abstraction
- รองรับ computed state
- รองรับ subscription ที่เชื่อมกับ Lit update cycle
- ใช้ context สำหรับ dependency sharing ระดับ tree

แนวทาง implementation:

- `signal(initialValue)`
- `store(initialObject)`
- `provide/inject` ผ่าน context

ไม่ควรเริ่มด้วยระบบซับซ้อนเกินไป เช่น event bus แบบครอบจักรวาล เพราะจะทำให้ maintenance ยาก

### 5.3 Rendering Modes

Lito ควรรองรับหลายโหมด:

- CSR: render ฝั่ง client ล้วน
- SSR: render HTML จาก server
- Partial hydration / islands: hydrate เฉพาะ component ที่ interactive

ลำดับการพัฒนาแนะนำ:

1. CSR + SSR พื้นฐาน
2. Route-level hydration
3. Islands architecture

### 5.4 Data Fetching Experience

เนื่องจาก Lit ไม่ได้มี hook แบบ React โดยธรรมชาติ Lito ควรออกแบบ API ที่ชัดและสอดคล้องกับ component model ของ Lit

ตัวอย่างแนวคิด:

- route `load()` function สำหรับฝั่ง server
- page component รับ data ผ่าน property หรือ context
- client helper สำหรับ refetch
- loading / error state utility

แนวทางนี้จะทำให้ page component ไม่ต้องจัดการ lifecycle ซับซ้อนเองทุกครั้ง

## 6. Backend Design Detail

### 6.1 Runtime

เริ่มจาก Node.js runtime ก่อน เพราะ:

- ecosystem กว้าง
- library รองรับมาก
- เหมาะกับการเริ่มต้น framework รุ่นแรก

จากนั้นค่อยออกแบบ runtime adapter เพื่อรองรับ Bun ภายหลัง

### 6.2 Routing

ระบบ routing ควรแบ่งเป็น 2 แบบ:

- Page routes
- API routes

ตัวอย่างโครงสร้าง:

```txt
app/
  pages/
    index.ts
    about.ts
    blog/
      [slug].ts
  api/
    health.ts
    users.ts
```

แนวคิด:

- `pages/` สร้าง route อัตโนมัติสำหรับหน้าเว็บ
- `api/` สร้าง route สำหรับ backend endpoint
- dynamic segments เช่น `[slug]`
- รองรับ layout และ nested routes ในระยะถัดไป

### 6.3 SSR Pipeline

SSR ของ Lito ควรประกอบด้วย:

1. รับ request
2. match route
3. execute data loader
4. render Lit component ด้วย SSR renderer
5. inject serialized route data ที่ปลอดภัย
6. ส่ง HTML พร้อม client entry สำหรับ hydration

สิ่งที่ต้องระวัง:

- XSS จาก serialized data
- สถานะ hydration mismatch
- การจัดการ async data หลายแหล่ง

### 6.4 Middleware and Request Context

ควรมี request context กลาง เช่น:

- params
- query
- cookies
- headers
- env
- user/session
- loaded data

และรองรับ middleware เช่น:

- logging
- auth
- rate limiting
- request timing

## 7. File-based Routing Strategy

File-based routing เป็นหนึ่งในคุณสมบัติสำคัญที่สุดของ Lito เพราะช่วยลดความซับซ้อนในการกำหนด route แบบ manual

ข้อเสนอ:

- `pages/_index.ts` => `/`
- `pages/about/_index.ts` => `/about`
- `pages/blog/[slug]/_index.ts` => `/blog/:slug`
- `pages/docs/[...all].ts` => catch-all route ในอนาคต

กติกาปัจจุบันของ repo:

- page routes จะถูกสร้างจากไฟล์ `_index.ts` เท่านั้น
- nested layouts ใช้ `_layout.ts`
- ถ้ามีไฟล์เก่าเช่น `pages/dashboard.ts` หรือ `pages/index.ts` โผล่มา `lito generate routes` ควร fail ทันทีเพื่อบังคับ convention เดียวกันทั้งโปรเจกต์

แต่ละ page file ควรกำหนด contract มาตรฐานได้ เช่น:

- default export เป็น page component
- optional `load()`
- optional `meta()`
- optional `config`

แนวคิดนี้จะช่วยให้ framework สแกนไฟล์และสร้าง route manifest ได้อัตโนมัติ

## 8. CLI Roadmap

CLI คือก้าวสำคัญของการ "framework-ize" แนวคิดทั้งหมด

คำสั่งรุ่นแรกที่ควรมี:

- `lito new`
- `lito dev`
- `lito build`
- `lito start`
- `lito generate routes`
- `lito generate page`
- `lito generate api`
- `lito generate layout`
- `lito generate resource`

สิ่งที่ CLI ควรทำ:

- scaffold project ใหม่
- generate page/component template
- sync route manifest
- run dev mode
- trigger production build

ระยะต่อไป:

- `lito test`
- `lito doctor`
- `lito add <plugin>`

## 9. Build System Strategy

ระยะแรกแนะนำให้ใช้ `Vite` เป็นฐานของ build system เพราะ:

- รองรับ dev experience ที่ดี
- integration กับ Lit ง่าย
- SSR workflow มีพื้นฐานรองรับ
- ecosystem plugin แข็งแรง

สิ่งที่ Lito ต้องเพิ่มบน Vite:

- client/server dual build orchestration
- route manifest generation
- SSR entry management
- asset mapping
- hydration manifest

แนวคิดสำคัญ:

- ใช้ Vite เป็น engine
- Lito เป็น orchestration layer

## 10. Testing Strategy

Lito เป็น framework ดังนั้น quality bar ต้องสูงกว่าการทำแอปทั่วไป เพราะ bug หนึ่งจุดอาจกระทบทุกโปรเจกต์ที่ใช้ framework

ควรวาง testing strategy ตั้งแต่ต้น:

### 10.1 Unit Tests

ทดสอบ:

- state primitives
- router matcher
- route manifest generator
- SSR helpers
- utility functions

### 10.2 Integration Tests

ทดสอบ:

- request เข้า route แล้ว render ได้ถูกต้อง
- page load data แล้วส่งเข้า component ได้จริง
- API route ทำงานร่วมกับ server runtime
- hydration ไม่พังเมื่อรับ HTML จาก SSR

### 10.3 End-to-End Tests

ใช้กับ demo app:

- เปิดหน้าเว็บจริง
- เปลี่ยน route
- submit form
- อ่านข้อมูลจาก API

เครื่องมือที่เหมาะ:

- `Vitest` สำหรับ unit/integration
- `Playwright` สำหรับ E2E

## 11. Recommended Development Phases

### Phase 1: Prove the Pattern

เป้าหมายคือพิสูจน์ว่าแนวคิดหลักใช้งานได้จริงแบบ manual ก่อน

สิ่งที่ต้องทำ:

- setup Lit + Vite
- setup server ด้วย Hono หรือ Express
- ทดลอง route หน้าเว็บอย่างน้อย 2 หน้า
- ทำ API endpoint อย่างน้อย 1 จุด
- ทำ SSR หน้าแรกสำเร็จ
- ส่ง data จาก server ไปยัง Lit component สำเร็จ

ผลลัพธ์ที่คาดหวัง:

- มี demo app ที่ทำงานครบ request -> server -> SSR -> hydrate
- เห็น pain points ที่จะกลายเป็น abstraction ของ framework

### Phase 2: Extract the Core

เป้าหมายคือดึง pattern ที่ซ้ำออกมาเป็น reusable modules

สิ่งที่ต้องทำ:

- สร้าง `LitoElement`
- สร้าง route loader contract
- สร้าง request context กลาง
- แยก router logic
- แยก SSR renderer

ผลลัพธ์:

- เริ่มเห็น package boundaries ชัดเจน
- ลดการเขียนซ้ำใน demo app

### Phase 3: Framework-ize

เป้าหมายคือเปลี่ยนจากชุด utility ให้กลายเป็น framework ที่มี convention

สิ่งที่ต้องทำ:

- file-based routing
- route manifest generation
- page conventions
- build orchestration
- CLI command รุ่นแรก

ผลลัพธ์:

- ผู้ใช้เริ่มสร้างแอปด้วย convention ได้
- การตั้งค่าใหม่ลดลงอย่างชัดเจน

### Phase 4: Production Readiness

สิ่งที่ต้องทำ:

- improve SSR stability
- error handling
- 404/500 pages
- env handling
- logging
- test coverage
- docs เบื้องต้น

ผลลัพธ์:

- พร้อมให้ทดลองใช้กับโปรเจกต์จริงขนาดเล็กถึงกลาง

### Phase 5: Advanced Features

สิ่งที่ต้องทำ:

- islands architecture
- nested layouts
- streaming SSR
- adapter สำหรับ Bun
- plugin system
- auth/data/form abstractions

## 12. Suggested MVP Scope

เพื่อไม่ให้ framework ใหญ่เกินไปตั้งแต่เริ่ม MVP ของ Lito ควรมีเท่านี้:

- Lit-based page/component model
- Base component
- Node.js server runtime
- SSR สำหรับ page route
- file-based routing พื้นฐาน
- API routes
- route loader สำหรับดึงข้อมูลจาก server
- Vite-based dev/build
- CLI ขั้นต้น
- unit + integration tests ชุดแรก

## 12.1 Current Status Snapshot

สถานะของ repo ณ ตอนนี้อยู่ประมาณ "ปลาย Phase 3" และเริ่มแตะงานบางส่วนของ Phase 4 แล้ว โดยสรุปได้ดังนี้:

- Phase 1 เสร็จแล้ว: มี playground ที่รันได้จริงทั้งแบบ manual และผ่าน framework packages
- Phase 2 เสร็จไปมาก: มี package boundaries ชัดเจนสำหรับ `core`, `router`, `server`, `app`, `cli`
- Phase 3 เสร็จไปมาก: มี file-based routing, route manifest generation, page/layout conventions, CLI commands, และ build/dev/start flow
- Phase 4 ยังไม่ครบ: ยังขาดระบบ error pages, middleware/logging ที่เป็น framework-level, env handling ที่ชัดเจน, tests, และ docs
- Phase 5 ยังแทบไม่เริ่ม: islands, streaming SSR, Bun adapter, plugin system, และ advanced abstractions ยังไม่อยู่ใน repo

สิ่งที่มีอยู่จริงใน packages ตอนนี้:

- `packages/core`
  - `LitoElement`
  - `signal()`
- `packages/router`
  - route matcher / resolver พื้นฐาน
- `packages/server`
  - Hono-based runtime
  - SSR HTML rendering
  - dev/prod client asset wiring
  - Node app bootstrap สำหรับรันบนพอร์ตเดียวร่วมกับ Vite middleware
- `packages/app`
  - shared contracts สำหรับ page/layout/api modules
  - manifest scanners
  - layout-level `load()`
  - merged document/head API
- `packages/cli`
  - `lito new`
  - `lito dev`
  - `lito build`
  - `lito start`
  - `lito generate routes`
  - `lito generate page`
  - `lito generate api`
  - `lito generate layout`
  - `lito generate resource`

## 12.2 Phase 4 Gap Analysis

เพื่อขยับจาก prototype framework ไปสู่ production readiness งานถัดไปใน `packages/*` ควรถูกทำตามลำดับนี้:

### Priority A: Runtime Safety and Error Handling

- `packages/server`
  - เพิ่ม 404 page contract ที่ app สามารถ override ได้
  - เพิ่ม 500/error response handling ที่แยกจาก unhandled exception ปัจจุบัน
  - แยก page render error กับ API error ให้มี response shape ที่ชัด
  - เพิ่ม safe serialization utility สำหรับ data ที่ซับซ้อนขึ้น
- `packages/app`
  - เพิ่ม `notFound` / `error` module contracts ระดับ app
  - รองรับ route-level config เช่น SSR on/off, cache hints, runtime flags

### Priority B: Middleware, Context, and Observability

- `packages/server`
  - ออกแบบ middleware API กลาง
  - เพิ่ม request context ที่ขยายได้ เช่น `query`, `cookies`, `headers`, `locals`, `env`
  - เพิ่ม logging hooks และ request timing
  - วางฐานสำหรับ auth/session integration

### Priority C: Build and Packaging Cleanup

- แยก `packages/build`
  - ย้าย orchestration logic ที่เกี่ยวกับ Vite และ manifest เข้า package เฉพาะทาง
  - นิยาม client/server build pipeline ให้ชัดขึ้น
- พิจารณาแยก `packages/ssr`
  - ย้าย Lit SSR renderer และ document rendering helpers ออกจาก `packages/server` ถ้า complexity โตขึ้น

### Priority D: Testing Foundation

- `packages/testing`
  - สร้าง helper สำหรับ integration tests ของ app routes และ api routes
- เพิ่ม unit tests สำหรับ:
  - `packages/router`
  - `packages/cli` route manifest generator
  - `packages/app` scanners
  - `packages/server` document serialization / route rendering
- เพิ่ม end-to-end checks กับ playground apps

### Priority E: Documentation and DX

- เพิ่ม docs สำหรับ page/layout/api conventions
- อธิบาย `_index.ts` / `_layout.ts` ให้ชัดเจน
- เพิ่ม migration note จาก convention เก่า `index.ts` ไปสู่ folder-based routing
- เพิ่ม `lito doctor` หรือ validation command สำหรับตรวจโครงสร้างโปรเจกต์

## 12.3 Suggested Next Milestone

ถ้าจะเลือก milestone ถัดไปเพียงชุดเดียว แนะนำให้โฟกัสที่:

1. `packages/server`: 404/500 + middleware context
2. `packages/app`: app-level error/not-found contracts
3. `packages/testing`: unit/integration test baseline
4. docs สำหรับ conventions และ lifecycle ของ page/layout/api modules

เมื่อสี่ส่วนนี้เสร็จ จะถือว่า Lito ขยับจาก "framework prototype ที่ใช้งานได้" ไปสู่ "framework alpha ที่เริ่มพร้อมใช้กับงานจริงขนาดเล็ก" ได้ชัดเจนมากขึ้น

สิ่งที่ยังไม่จำเป็นใน MVP:

- islands
- plugin marketplace
- advanced state devtools
- streaming SSR
- multi-runtime support เต็มรูปแบบ

## 13. Risks and Design Challenges

ประเด็นที่ต้องระวังตั้งแต่ต้น:

### 13.1 Lit SSR Complexity

แม้ Lit มีเครื่องมือ SSR แต่ประสบการณ์ใช้งานจริงอาจมีข้อจำกัดเมื่อเทียบกับ ecosystem ใหญ่กว่า จึงควรทดลองกับ use case จริงเร็วที่สุด

### 13.2 Hydration Contract

การทำให้ SSR HTML และ client state ตรงกันต้องมี contract ชัดเจน ไม่เช่นนั้นจะเกิด hydration mismatch ได้ง่าย

### 13.3 Too Much Abstraction Too Early

ความเสี่ยงใหญ่คือพยายามออกแบบ framework ใหญ่เกินไปก่อนเห็น pain points จริง ควรปล่อยให้ Phase 1 และ 2 เปิดเผยรูปแบบที่เหมาะสมก่อน

### 13.4 Runtime Lock-in

ถ้าผูก logic ลึกเกินไปกับ runtime เดียว เช่น Express มากเกินไป จะทำให้รองรับ Bun หรือ runtime อื่นยากในอนาคต

## 14. Why This Project Is Worth Building

Lito เป็นโปรเจกต์ที่คุ้มค่ามากทั้งในเชิงเทคนิคและเชิงการเติบโตของผู้สร้าง เพราะจะทำให้เข้าใจ:

- Web Components ในระดับลึก
- กลไกการ render ของ Lit
- SSR lifecycle
- การออกแบบ router และ server runtime
- build system integration
- testing strategy สำหรับ framework

ในเชิง career value โปรเจกต์นี้ช่วยสร้างทักษะเด่นมาก โดยเฉพาะ:

- การออกแบบสถาปัตยกรรม
- การคิดแบบ product + platform
- การเขียน integration tests อย่างเป็นระบบ
- การแยก abstraction ที่เหมาะสม

## 15. Immediate Next Steps

ลำดับที่แนะนำให้เริ่มทันที:

1. สร้าง prototype แบบ manual ด้วย `Lit + Vite + Hono`
2. ทำหน้า SSR แรกให้สำเร็จพร้อมส่ง data จาก server ไปยัง component
3. สรุป pattern ที่ซ้ำและ pain points จาก prototype
4. แตกโค้ดออกเป็น `core`, `server`, `router`
5. เริ่มสร้าง CLI สำหรับ scaffold และ create page
6. เพิ่ม test suite ตั้งแต่เวอร์ชันแรก

## 16. Definition of Success for First Release

Lito v0 รุ่นแรกควรถือว่าสำเร็จเมื่อ:

- ผู้ใช้สร้างโปรเจกต์ใหม่ได้จาก CLI
- สร้าง page ใหม่ด้วย file-based routing ได้
- เขียน API route และ page route ในโปรเจกต์เดียวกันได้
- render หน้าแบบ SSR ได้
- hydrate component ฝั่ง client ได้
- ดึงข้อมูลจาก server ไปแสดงผลใน page ได้
- มีตัวอย่าง demo app และ test ครอบคลุม flow หลัก

## 17. Final Recommendation

ข้อเสนอที่ดีที่สุดสำหรับการเริ่ม Lito คือ:

- เริ่มเล็กแต่โครงสร้างคิดใหญ่
- ใช้ prototype เป็นตัวค้นหา abstraction ที่แท้จริง
- ใช้ Lit เป็นแกนหลักอย่างชัดเจน ไม่พยายามเลียนแบบ React ทั้งหมด
- ลงทุนกับ routing, SSR และ testing ให้แน่น เพราะ 3 ส่วนนี้คือแกนของความเป็น full-stack framework

ถ้าทำตามแนวทางนี้ Lito จะมีโอกาสเติบโตเป็น framework ที่มีเอกลักษณ์ชัด คือเบา เร็ว ใช้มาตรฐานเว็บจริง และเหมาะกับคนที่ต้องการ full-stack experience โดยไม่ต้องแบก runtime ฝั่ง frontend ที่หนักเกินจำเป็น

## 18. Weekly TODO Roadmap

Roadmap นี้ออกแบบสำหรับช่วงเริ่มต้น 12 สัปดาห์ โดยเน้นให้ได้ของจริงเร็ว เห็น pattern เร็ว และค่อยสกัด abstraction ออกมาเป็น framework อย่างมีวินัย

### Week 1: Project Bootstrap and Technical Baseline

เป้าหมาย:

- ตั้งต้น repo และสภาพแวดล้อมการพัฒนาให้พร้อมสำหรับการสร้าง prototype

TODO:

- สร้างโครงสร้างโปรเจกต์เริ่มต้นสำหรับ Lito
- ตัดสินใจรูปแบบ repo ว่าจะเริ่มแบบ single package หรือ monorepo
- ติดตั้ง `Vite`, `Lit`, `TypeScript`
- ตั้งค่า lint, format และ tsconfig พื้นฐาน
- สร้าง `playground/demo-app` สำหรับทดลอง framework
- เขียน README สั้นสำหรับวิธีรันโปรเจกต์

Deliverables:

- repo รัน dev server ได้
- Lit component แรกแสดงผลได้
- developer setup ชัดเจนและใช้งานซ้ำได้

Definition of Done:

- คนใหม่ clone repo แล้วรันโปรเจกต์ได้ภายในไม่กี่ขั้นตอน

### Week 2: Server Runtime Prototype

เป้าหมาย:

- วาง backend runtime ต้นแบบสำหรับ full-stack flow

TODO:

- เลือก server runtime เริ่มต้นเป็น `Hono`
- ตั้งค่า HTTP server สำหรับ dev mode
- เพิ่ม route พื้นฐาน เช่น `/` และ `/api/health`
- วางโครง request context เบื้องต้น
- ทดสอบการตอบกลับ HTML และ JSON จาก server เดียวกัน

Deliverables:

- demo server ที่เสิร์ฟทั้งหน้าเว็บและ API ได้
- มี health endpoint สำหรับใช้ตรวจสอบ runtime

Definition of Done:

- request เข้า route หน้าเว็บและ API ได้จาก process เดียว

### Week 3: First SSR Page with Lit

เป้าหมาย:

- ทำให้ Lit render ฝั่ง server ได้จริง

TODO:

- ทดลองใช้ `@lit-labs/ssr`
- สร้าง pipeline สำหรับ render page ออกเป็น HTML string
- ทำหน้าแรกแบบ SSR
- แยก server renderer ออกจาก logic routing
- กำหนด HTML document shell พื้นฐาน

Deliverables:

- หน้า `/` render จาก server ได้จริง
- server ส่ง HTML ที่มีเนื้อหาจาก Lit component

Definition of Done:

- เปิดดู source ของหน้าแล้วเห็น content จาก SSR ไม่ใช่ div ว่าง

### Week 4: Hydration and Client Boot

เป้าหมาย:

- เชื่อม SSR เข้ากับฝั่ง client ให้ component interactive ได้

TODO:

- สร้าง client entry สำหรับ hydrate หน้า SSR
- ตรวจสอบ hydration mismatch เบื้องต้น
- ทดลอง interactive component อย่างน้อย 1 ชิ้น
- วางรูปแบบส่ง initial data จาก server ไป client
- สร้าง helper สำหรับอ่าน serialized data อย่างปลอดภัย

Deliverables:

- หน้า SSR ที่ hydrate แล้วโต้ตอบได้
- มี flow server data -> HTML -> client hydration

Definition of Done:

- component ที่ render จาก SSR สามารถโต้ตอบต่อบน client ได้โดยไม่พัง

### Week 5: Route Data Loading Contract

เป้าหมาย:

- นิยามรูปแบบมาตรฐานสำหรับการโหลดข้อมูลของแต่ละหน้า

TODO:

- ออกแบบ `load()` contract สำหรับ page route
- ส่ง `params`, `query`, `headers` เข้า loader
- นำผลจาก loader เข้า page component
- เพิ่มการจัดการ loading และ error state ระดับหน้า
- ทดลองหน้า dynamic route อย่างน้อย 1 หน้า

Deliverables:

- page route ที่มี loader ใช้งานจริง
- เอกสารสั้นอธิบาย lifecycle: request -> loader -> render -> hydrate

Definition of Done:

- page สามารถดึงข้อมูลจาก server side loader แล้วแสดงผลได้อย่างเป็นมาตรฐานเดียวกัน

### Week 6: File-based Routing MVP

เป้าหมาย:

- เปลี่ยนจาก manual route definition ไปเป็น file-based routing

TODO:

- กำหนด convention ของโฟลเดอร์ `app/pages`
- เขียนตัวสแกนไฟล์ route
- รองรับ static route และ dynamic route เช่น `[slug]`
- สร้าง route manifest รุ่นแรก
- ผูก route manifest เข้ากับ server runtime

Deliverables:

- สร้างไฟล์หน้าใหม่แล้วกลายเป็น route อัตโนมัติ
- route manifest ถูก generate ได้ถูกต้อง

Definition of Done:

- เพิ่มไฟล์ใหม่ใน `pages/` แล้วเข้า URL ตรงกับชื่อไฟล์ได้โดยไม่ต้องแก้ router manual

### Week 7: API Routes and Shared App Structure

เป้าหมาย:

- ทำให้ framework รองรับทั้ง page routes และ API routes ใน convention เดียวกัน

TODO:

- เพิ่มโฟลเดอร์ `app/api`
- สร้าง contract สำหรับ API handler
- แยก page routing กับ API routing ให้ชัด
- รองรับ methods อย่างน้อย `GET` และ `POST`
- ทดลองหน้าเว็บที่เรียกข้อมูลจาก API route ของตัวเอง

Deliverables:

- API route ทำงานภายใต้ framework convention เดียวกัน
- demo app ที่มีทั้งหน้าเว็บและ backend endpoint

Definition of Done:

- ผู้ใช้สามารถสร้างไฟล์ API ใหม่และเรียกใช้งานได้ทันที

### Week 8: Extract Core Packages

เป้าหมาย:

- สกัด logic ที่พิสูจน์แล้วออกเป็นแกน framework

TODO:

- แยก `core`, `server`, `router` ออกจาก demo app
- สร้าง `LitoElement` หรือ base frontend abstraction รุ่นแรก
- แยก request context และ route contracts เป็นโมดูลกลาง
- ลดการอ้าง path หรือ implementation แบบ hard-coded
- ปรับ demo app ให้ใช้งานผ่าน package ภายใน

Deliverables:

- ขอบเขตของ package หลักเริ่มชัด
- demo app ใช้ abstraction ของ Lito มากกว่า logic เฉพาะกิจ

Definition of Done:

- logic หลักของ framework ไม่ปะปนอยู่ใน demo app แบบกระจัดกระจาย

### Week 9: CLI Foundations

เป้าหมาย:

- เริ่มสร้าง developer tooling ที่ทำให้ Lito ใช้งานเหมือน framework จริง

TODO:

- สร้าง package `cli`
- เพิ่มคำสั่ง `lito dev`
- เพิ่มคำสั่ง `lito generate page`
- เพิ่มคำสั่ง scaffold สำหรับ app template ขั้นต้น
- ให้ CLI เรียก route sync หรือ manifest generation ได้

Deliverables:

- ใช้ CLI เพื่อเริ่ม dev server และสร้าง page ใหม่ได้
- ลดขั้นตอน manual setup ลงชัดเจน

Definition of Done:

- การสร้าง page ใหม่ไม่ต้อง copy file ด้วยมืออีกต่อไป

### Week 10: Build Pipeline MVP

เป้าหมาย:

- ทำ production build สำหรับทั้ง client และ server

TODO:

- ออกแบบ `lito build`
- แยก client build และ server build
- จัดการ asset manifest
- กำหนด output structure สำหรับ production
- เพิ่ม `lito start` เพื่อรัน build ที่ถูกสร้างแล้ว

Deliverables:

- โปรเจกต์สามารถ build และ start ในโหมด production ได้
- asset client ถูกอ้างอิงถูกต้องจาก server output

Definition of Done:

- รัน build แล้วเปิดแอปจาก output production ได้จริง

### Week 11: Testing Infrastructure

เป้าหมาย:

- วางระบบทดสอบที่ปกป้อง behavior หลักของ framework

TODO:

- ติดตั้ง `Vitest`
- เขียน unit tests สำหรับ router matcher และ route manifest
- เขียน integration tests สำหรับ SSR flow
- เพิ่ม test สำหรับ loader contract
- วางโครง E2E test ด้วย `Playwright`

Deliverables:

- test suite ชุดแรกครอบคลุม core flows
- มี command สำหรับรันทดสอบแบบสม่ำเสมอ

Definition of Done:

- framework behavior หลักมี automated tests รองรับ ไม่พึ่ง manual test อย่างเดียว

### Week 12: First Usable Alpha

เป้าหมาย:

- รวมทุกส่วนให้กลายเป็น alpha release ภายในทีม

TODO:

- เก็บ bug จากการใช้งานจริงใน demo app
- เพิ่ม 404/500 page handling
- ปรับ docs สำหรับการเริ่มต้นใช้งาน
- ตรวจสอบ naming, API surface และโครงสร้างไฟล์
- สรุปสิ่งที่ควรเลื่อนไปหลัง alpha

Deliverables:

- Lito alpha ที่สามารถสร้างแอปพื้นฐานได้จริง
- เอกสารเริ่มต้นสำหรับผู้ทดลองใช้

Definition of Done:

- ผู้ใช้ภายในทีมสามารถทดลองสร้าง app ด้วย Lito โดยไม่ต้องพึ่งคนสร้างคอยอธิบายทุกขั้น

## 19. Cross-cutting TODOs Every Week

มีงานบางอย่างที่ไม่ควรรอไปทำท้ายโปรเจกต์ ควรทำต่อเนื่องทุกสัปดาห์:

- จด pain points และ abstraction candidate จากงานที่ทำ
- ปรับปรุงเอกสาร architecture เมื่อมีการเปลี่ยน design
- เพิ่ม tests สำหรับ bug ที่เพิ่งเจอ
- ทบทวน API naming ให้สม่ำเสมอ
- เก็บ technical decisions สำคัญไว้ใน decision log
- ตรวจ performance เบื้องต้นของ SSR และ hydration

## 20. Suggested Milestones

เพื่อให้ roadmap วัดผลได้ง่าย แนะนำ milestone ดังนี้:

- Milestone A at Week 4: SSR + hydration prototype สำเร็จ
- Milestone B at Week 7: file-based routing + API routes ใช้งานได้
- Milestone C at Week 10: CLI + production build MVP พร้อม
- Milestone D at Week 12: alpha release ภายในทีม

## 21. Practical Execution Advice

เพื่อให้ roadmap นี้เดินได้จริง ควรทำงานในจังหวะดังนี้:

- ใช้ `playground/demo-app` เป็นสนามทดลองของทุก feature ก่อนสกัดเป็น package
- อย่าข้ามการเขียน test ของ routing, SSR และ loader เพราะ 3 ส่วนนี้เปราะบางที่สุด
- ถ้าสัปดาห์ไหน scope เริ่มบวม ให้ตัด feature ที่ไม่ใช่แกน เช่น islands หรือ plugin system ออกก่อน
- ทุกครั้งที่พบ pattern ซ้ำ 2-3 ครั้ง ค่อยดึง abstraction ไม่ต้องรีบ generic ตั้งแต่ครั้งแรก

## 22. Recommended Backlog After Week 12

ถ้า alpha รุ่นแรกนิ่งแล้ว backlog ถัดไปที่ควรพิจารณาคือ:

- nested layouts
- route-level metadata API ที่ครบขึ้น
- forms and actions
- auth helpers
- streaming SSR
- islands architecture
- Bun adapter
- plugin system
- docs site และ example apps เพิ่มเติม
````

## File: playgrounds/demo-app/app/api/products/[id].ts
````typescript
import { defineApiRoute } from "@lito/server";

type ProductDetailParams = {
  id: string;
};

const productDetailQuery = {
  q: "number",
  draft: "boolean",
  tag: "strings"
} as const;

const route = defineApiRoute<ProductDetailParams, typeof productDetailQuery>({
  query: productDetailQuery,
  get: ({ params, queryData }) =>
    Response.json({
      ok: true,
      resource: "products",
      action: "detail",
      id: params.id,
      query: queryData
    }),
  put: ({ params }) =>
    Response.json({
      ok: true,
      resource: "products",
      action: "update",
      id: params.id
    }),
  delete: ({ params }) =>
    Response.json({
      ok: true,
      resource: "products",
      action: "delete",
      id: params.id
    })
});

export default route;
````

## File: playgrounds/demo-app/app/api/users/[id]/[postId].ts
````typescript
export function get() {
  return Response.json({
    ok: true,
    route: "users/[id]/[postId]"
  });
}
````

## File: playgrounds/demo-app/app/api/health.ts
````typescript
export function get() {
  return Response.json({ ok: true });
}
````

## File: playgrounds/demo-app/app/api/products.ts
````typescript
export function get() {
  return Response.json({
    ok: true,
    resource: "products",
    action: "list"
  });
}

export function post() {
  return Response.json({
    ok: true,
    resource: "products",
    action: "create"
  });
}
````

## File: playgrounds/demo-app/app/pages/docs/getting-started/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>New Page</h1>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-app/app/pages/docs/getting-started/_index.ts to continue.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/docs/_layout.ts
````typescript
import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule = {
  render: ({ children }) => children
};

export default layout;
````

## File: playgrounds/demo-app/app/pages/orders/[id]/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>New Page</h1>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-app/app/pages/orders/[id]/_index.ts to continue.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/products/[id]/edit/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Edit Products"
  },
  render: ({ params }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Edit Products</h1>
      <p>Updating products with id <strong>${params.id}</strong>.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/products/[id]/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Products Detail"
  },
  render: ({ params }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Products Detail</h1>
      <p>Viewing products with id <strong>${params.id}</strong>.</p>
      <p><a href="/products/${params.id}/edit">Edit this products</a></p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/products/new/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Create Products"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Create Products</h1>
      <p>This page represents the create flow for products.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/products/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Products List"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Products List</h1>
      <p>Read all products records here.</p>
      <ul>
        <li><a href="/products/new">Create new products</a></li>
        <li><a href="/products/1">Open Products #1</a></li>
      </ul>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/users/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>New Page</h1>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-app/app/pages/users/_index.ts to continue.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Welcome to Lito"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Welcome to Lito</h1>
      <p>Your app scaffold is ready.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-app/app/pages/_layout.ts
````typescript
import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Lito App"
  }),
  render: ({ children }) => html`
    <div style="min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);">
      ${children}
    </div>
  `
};

export default layout;
````

## File: playgrounds/demo-app/src/generated/.gitkeep
````

````

## File: playgrounds/demo-app/src/generated/api-manifest.ts
````typescript
export const apiModulePaths = [
  "../../app/api/health.ts",
  "../../app/api/products/[id].ts",
  "../../app/api/products.ts"
] as const;
````

## File: playgrounds/demo-app/src/generated/page-manifest.ts
````typescript
export const pageManifest = [
  {
    "page": "../../app/pages/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "index"
  },
  {
    "page": "../../app/pages/docs/getting-started/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts",
      "../../app/pages/docs/_layout.ts"
    ],
    "routeId": "docs:getting-started"
  },
  {
    "page": "../../app/pages/products/[id]/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:[id]"
  },
  {
    "page": "../../app/pages/products/[id]/edit/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:[id]:edit"
  },
  {
    "page": "../../app/pages/products/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products"
  },
  {
    "page": "../../app/pages/products/new/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:new"
  }
] as const;
````

## File: playgrounds/demo-app/src/main.ts
````typescript
console.info("Lito client runtime loaded");
````

## File: playgrounds/demo-app/index.html
````html
<!doctype html>
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
````

## File: playgrounds/demo-app/package.json
````json
{
  "name": "demo-app",
  "private": true,
  "type": "module",
  "scripts": {
    "generate:routes": "pnpm --filter @lito/cli build && pnpm exec lito generate routes --root .",
    "dev": "pnpm exec lito dev --root .",
    "build": "pnpm exec lito build --root .",
    "start": "pnpm exec lito start --root ."
  },
  "dependencies": {
    "@lito/app": "workspace:*",
    "@lito/server": "workspace:*",
    "lit": "^3.2.0"
  },
  "devDependencies": {
    "@lito/cli": "workspace:*",
    "tsx": "^4.19.2",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
````

## File: playgrounds/demo-app/server.ts
````typescript
import { scanApiRoutesFromManifest, scanPageRoutesFromManifest } from "@lito/app";
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

console.log(`Lito app is running at http://localhost:${process.env.PORT ?? 3000}`);
````

## File: playgrounds/demo-app/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "noEmit": true
  },
  "include": [
    "src/**/*.ts",
    "app/**/*.ts",
    "server.ts",
    "vite.config.ts"
  ]
}
````

## File: playgrounds/demo-app/vite.config.ts
````typescript
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  build: {
    manifest: "manifest.json"
  }
});
````

## File: playgrounds/demo-hydration/app/api/health.ts
````typescript
export function get() {
  return Response.json({ ok: true });
}
````

## File: playgrounds/demo-hydration/app/pages/csr-page/_index.ts
````typescript
"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  load: async ({ url }) => {
    // Determine absolute URL (works on both client and SSR server)
    const apiUrl = new URL("/api/health", url.origin).href;
    const res = await fetch(apiUrl);
    return res.json();
  },
  render: ({ data }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>CSR Page Fetching API</h1>
      <pre>API returned: ${JSON.stringify(data, null, 2)}</pre>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-hydration/app/pages/csr-page/_index.ts to continue.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-hydration/app/pages/ssr-page/_index.ts
````typescript
"use server";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { get as getHealth } from "../../api/health.js";

export type ActionData = {
  success: boolean;
  message: string;
};

const page: LitoPageModule<unknown, ActionData> = {
  cache: {
    maxAge: 10,
    staleWhileRevalidate: 30
  },
  document: {
    title: "New Page"
  },
  load: async () => {
    // SSR Direct Function Call (No Network Fetch!)
    const res = await getHealth();
    return res.json();
  },
  action: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    
    return {
      success: true,
      message: `Form Action Successfully Captured Name: ${name || 'Anonymous'}`
    };
  },
  render: ({ data, actionData }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>SSR Page with Form Actions</h1>
      <pre>API returned: ${JSON.stringify(data, null, 2)}</pre>

      <section style="margin-top: 32px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2>Form Submission Test</h2>
        ${actionData?.success 
          ? html`<div style="color: #15803d; margin-bottom: 16px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
              ${actionData.message}
            </div>` 
          : html``}
          
        <form method="POST">
          <label style="display: block; margin-bottom: 8px;">Name</label>
          <input type="text" name="name" placeholder="Enter your name" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; max-width: 300px;" />
          <button type="submit" style="margin-top: 16px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Submit Server Action
          </button>
        </form>
      </section>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-hydration/app/pages/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Welcome to Lito"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Welcome to Lito</h1>
      <p>Your app scaffold is ready.</p>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-hydration/app/pages/_layout.ts
````typescript
import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Lito App"
  }),
  render: ({ children }) => html`
    <div style="min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);">
      ${children}
    </div>
  `
};

export default layout;
````

## File: playgrounds/demo-hydration/src/generated/.gitkeep
````

````

## File: playgrounds/demo-hydration/src/generated/api-manifest.ts
````typescript
export const apiModulePaths = [
  "../../app/api/health.ts"
] as const;
````

## File: playgrounds/demo-hydration/src/generated/page-manifest.ts
````typescript
import type { LitoPageManifestEntry } from "@lito/app";

export const pageManifest: LitoPageManifestEntry[] = [
  {
    page: () => import("../../app/pages/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "index",
    routePath: "/"
  },
  {
    page: () => import("../../app/pages/csr-page/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "csr-page",
    routePath: "/csr-page",
    mode: "client"
  },
  {
    page: () => import("../../app/pages/ssr-page/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "ssr-page",
    routePath: "/ssr-page",
    mode: "server"
  }
];
````

## File: playgrounds/demo-hydration/src/main.ts
````typescript
import { bootLitoClient } from "@lito/app";
import { pageManifest } from "./generated/page-manifest.js";

bootLitoClient({ pageManifest });
````

## File: playgrounds/demo-hydration/index.html
````html
<!doctype html>
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
````

## File: playgrounds/demo-hydration/package.json
````json
{
  "name": "demo-hydration",
  "private": true,
  "type": "module",
  "scripts": {
    "generate:routes": "pnpm --filter @lito/cli build && pnpm exec lito generate routes --root .",
    "dev": "pnpm exec lito dev --root .",
    "build": "pnpm exec lito build --root .",
    "start": "pnpm exec lito start --root ."
  },
  "dependencies": {
    "@lito/app": "workspace:*",
    "@lito/server": "workspace:*",
    "lit": "^3.2.0"
  },
  "devDependencies": {
    "@lito/cli": "workspace:*",
    "tsx": "^4.19.2",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
````

## File: playgrounds/demo-hydration/server.ts
````typescript
import { scanApiRoutesFromManifest, scanPageRoutesFromManifest } from "@lito/app";
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

console.log(`Lito app is running at http://localhost:${process.env.PORT ?? 3000}`);
````

## File: playgrounds/demo-hydration/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": [
      "ES2022",
      "DOM",
      "DOM.Iterable"
    ],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "noEmit": true
  },
  "include": [
    "src/**/*.ts",
    "app/**/*.ts",
    "server.ts",
    "vite.config.ts"
  ]
}
````

## File: playgrounds/demo-hydration/vite.config.ts
````typescript
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  plugins: [
    {
      name: "lito-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        if (!options?.ssr && (id.includes("/app/api/") || id.endsWith("/app/api"))) {
          throw new Error(`\n\n[LITO] Protection Error:\nCannot import backend API route '${id}' in a Client context!\n(Imported by ${importer})\n\n`);
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
````

## File: playgrounds/demo-state/app/api/catalog.ts
````typescript
import { defineApiRoute } from "@lito/server";

const catalog = [
  {
    id: "signal",
    title: "signal()",
    kind: "state",
    featured: true,
    tags: ["reactive", "client"]
  },
  {
    id: "memo",
    title: "memo()",
    kind: "derived",
    featured: true,
    tags: ["reactive", "computed"]
  },
  {
    id: "watch",
    title: "watch()",
    kind: "effects",
    featured: false,
    tags: ["client", "effects"]
  },
  {
    id: "store",
    title: "store()",
    kind: "state",
    featured: true,
    tags: ["objects", "state"]
  },
  {
    id: "config-ssr",
    title: "config.ssr = false",
    kind: "routing",
    featured: false,
    tags: ["csr", "pages"]
  }
] as const;

export default defineApiRoute({
  query: {
    limit: "number",
    featured: "boolean",
    tag: "strings"
  },
  get({ queryData }) {
    const limit = queryData?.limit ?? catalog.length;
    const featured = queryData?.featured;
    const tags = queryData?.tag ?? [];

    const filtered = catalog
      .filter((item) => (featured === null || featured === undefined ? true : item.featured === featured))
      .filter((item) => (tags.length === 0 ? true : tags.every((tag) => item.tags.includes(tag))))
      .slice(0, limit ?? catalog.length);

    return Response.json({
      ok: true,
      total: filtered.length,
      items: filtered
    });
  }
});
````

## File: playgrounds/demo-state/app/api/health.ts
````typescript
export function get() {
  return Response.json({
    ok: true,
    framework: "Lito",
    area: "demo-state"
  });
}
````

## File: playgrounds/demo-state/app/pages/counter/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { LitoElement, delegateEvents, memo, signal, watch } from "@lito/core";

const count = signal(3);
const doubled = memo(() => count.get() * 2);
const status = memo(() => (count.get() >= 10 ? "heated" : count.get() >= 5 ? "warming" : "idle"));

watch(() => {
  console.log(`[counter-demo] count=${count.get()} doubled=${doubled.get()} status=${status.get()}`);
}, { target: "client" });

const tagName = "lito-demo-counter";

if (!customElements.get(tagName)) {
  class LitoDemoCounter extends LitoElement {
    private stopDelegatedEvents?: () => void;

    override connectedCallback(): void {
      super.connectedCallback();
      this.stopDelegatedEvents = delegateEvents(this, {
        click: {
          '[data-action="decrement"]': () => count.update((value) => value - 1),
          '[data-action="increment"]': () => count.update((value) => value + 1),
          '[data-action="boost"]': () => count.update((value) => value + 5),
          '[data-action="reset"]': () => count.set(3)
        }
      });
    }

    override disconnectedCallback(): void {
      this.stopDelegatedEvents?.();
      this.stopDelegatedEvents = undefined;
      super.disconnectedCallback();
    }

    protected override createRenderRoot() {
      return this;
    }

    override render() {
      return html`
        <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
          <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
            <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">Client-only page</div>
            <h2 style="margin: 12px 0 8px; font-size: 2.4rem;">Counter powered by Lito primitives</h2>
            <p style="margin: 0; color: #b9c7da; line-height: 1.7;">
              This route uses <code>config.ssr = false</code>, so the server sends only the client root placeholder.
            </p>

            <div style="display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px;">
              <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                <div style="font-size: 0.8rem; color: #94a3b8;">Count</div>
                <div style="font-size: 2.4rem; margin-top: 10px;">${count.get()}</div>
              </div>
              <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                <div style="font-size: 0.8rem; color: #94a3b8;">Doubled</div>
                <div style="font-size: 2.4rem; margin-top: 10px;">${doubled.get()}</div>
              </div>
              <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                <div style="font-size: 0.8rem; color: #94a3b8;">Status</div>
                <div style="font-size: 1.6rem; margin-top: 14px; text-transform: capitalize;">${status.get()}</div>
              </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px;">
              <button data-action="decrement" style=${buttonStyle("#0f172a", "#cbd5e1")}>-1</button>
              <button data-action="increment" style=${buttonStyle("#0ea5e9", "#082f49")}>+1</button>
              <button data-action="boost" style=${buttonStyle("#f59e0b", "#451a03")}>+5</button>
              <button data-action="reset" style=${buttonStyle("transparent", "#fecaca", "1px solid rgba(248, 113, 113, 0.55)")}>Reset</button>
            </div>
          </div>
        </section>
      `;
    }
  }

  customElements.define(tagName, LitoDemoCounter);
}

const page: LitoPageModule = {
  config: {
    ssr: false
  },
  document: {
    title: "Counter | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; } code { color: #f59e0b; }"]
  },
  render: () => html`<lito-demo-counter></lito-demo-counter>`
};

export default page;

function buttonStyle(background: string, color: string, border = "none") {
  return [
    `background: ${background}`,
    `color: ${color}`,
    `border: ${border}`,
    "padding: 10px 16px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
````

## File: playgrounds/demo-state/app/pages/server-data/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

type CatalogPayload = {
  ok: boolean;
  total: number;
  items: Array<{
    id: string;
    title: string;
    kind: string;
    featured: boolean;
    tags: string[];
  }>;
};

const page: LitoPageModule<CatalogPayload> = {
  document: {
    title: "Server Data | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  load: async ({ url }) => {
    const response = await fetch(new URL("/api/catalog?limit=3&featured=true&tag=reactive", url.origin));
    return response.json();
  },
  render: ({ data }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
      <section style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16); color: #e5eefb;">
        <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">SSR data page</div>
        <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Loaded from a typed Lito API route</h2>
        <p style="margin: 0; color: #b9c7da; line-height: 1.7;">
          This page stays SSR and calls <code>/api/catalog</code> during <code>load()</code>.
        </p>
        <div style="display: grid; gap: 12px; margin-top: 24px;">
          ${data.items.map(
            (item) => html`
              <article style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                <div style="font-size: 0.82rem; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.12em;">${item.kind}</div>
                <h3 style="margin: 8px 0 6px;">${item.title}</h3>
                <div style="color: #94a3b8;">Tags: ${item.tags.join(", ")}</div>
              </article>
            `
          )}
        </div>
      </section>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-state/app/pages/store/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { LitoElement, batch, delegateEvents, store } from "@lito/core";

const profile = store({
  name: "Lito Operator",
  role: "Framework Engineer",
  theme: "amber" as "amber" | "ocean",
  notifications: true
});

const tagName = "lito-demo-store";

if (!customElements.get(tagName)) {
  class LitoDemoStore extends LitoElement {
    private stopDelegatedEvents?: () => void;

    override connectedCallback(): void {
      super.connectedCallback();
      this.stopDelegatedEvents = delegateEvents(this, {
        click: {
          '[data-action="rename"]': () => {
            const nextName = prompt("Name", profile.get("name"));
            if (nextName) profile.set("name", nextName);
          },
          '[data-action="rerole"]': () => {
            const nextRole = prompt("Role", profile.get("role"));
            if (nextRole) profile.set("role", nextRole);
          },
          '[data-action="toggle-theme"]': () => {
            profile.set("theme", profile.get("theme") === "amber" ? "ocean" : "amber");
          },
          '[data-action="toggle-notifications"]': () => {
            profile.set("notifications", !profile.get("notifications"));
          },
          '[data-action="preset"]': () => {
            batch(() => {
              profile.set({
                name: "DX Captain",
                role: "Platform Builder",
                theme: "ocean",
                notifications: false
              });
            });
          }
        }
      });
    }

    override disconnectedCallback(): void {
      this.stopDelegatedEvents?.();
      this.stopDelegatedEvents = undefined;
      super.disconnectedCallback();
    }

    protected override createRenderRoot() {
      return this;
    }

    override render() {
      const current = profile.get();

      return html`
        <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
          <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
            <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">store() demo</div>
            <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Object state through a single framework store</h2>
            <div style="display: grid; gap: 14px; margin-top: 22px;">
              ${renderField("Name", current.name, "rename")}
              ${renderField("Role", current.role, "rerole")}
              ${renderField("Theme", current.theme, "toggle-theme")}
              ${renderField("Notifications", current.notifications ? "Enabled" : "Muted", "toggle-notifications")}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
              <button data-action="preset" style=${actionButton("#f59e0b", "#451a03")}>Load Preset</button>
            </div>
          </div>
        </section>
      `;
    }
  }

  customElements.define(tagName, LitoDemoStore);
}

const page: LitoPageModule = {
  config: {
    ssr: false
  },
  document: {
    title: "Store | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  render: () => html`<lito-demo-store></lito-demo-store>`
};

export default page;

function renderField(label: string, value: string, action: string) {
  return html`
    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
      <div>
        <div style="font-size: 0.82rem; color: #94a3b8;">${label}</div>
        <div style="margin-top: 6px; font-size: 1.05rem;">${value}</div>
      </div>
      <button data-action=${action} style=${actionButton("#0f172a", "#dbe7f5")}>Change</button>
    </div>
  `;
}

function actionButton(background: string, color: string) {
  return [
    `background: ${background}`,
    `color: ${color}`,
    "border: 1px solid rgba(148, 163, 184, 0.2)",
    "padding: 10px 14px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
````

## File: playgrounds/demo-state/app/pages/todos/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { LitoElement, delegateEvents, memo, signal } from "@lito/core";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const todos = signal<Todo[]>([
  { id: 1, text: "Scaffold app with lito", done: true },
  { id: 2, text: "Mark page as client-only", done: true },
  { id: 3, text: "Wire delegated browser events", done: false }
]);
const filter = signal<"all" | "active" | "done">("all");
const inputValue = signal("");

let nextId = 4;

const visibleTodos = memo(() => {
  const currentFilter = filter.get();
  const currentTodos = todos.get();

  if (currentFilter === "active") return currentTodos.filter((item) => !item.done);
  if (currentFilter === "done") return currentTodos.filter((item) => item.done);
  return currentTodos;
});

const totals = memo(() => {
  const currentTodos = todos.get();
  const done = currentTodos.filter((item) => item.done).length;
  return {
    total: currentTodos.length,
    done,
    active: currentTodos.length - done
  };
});

const tagName = "lito-demo-todos";

if (!customElements.get(tagName)) {
  class LitoDemoTodos extends LitoElement {
    private stopDelegatedEvents?: () => void;

    override connectedCallback(): void {
      super.connectedCallback();
      this.stopDelegatedEvents = delegateEvents(this, {
        input: {
          '[data-role="todo-input"]': (event) => {
            inputValue.set((event.target as HTMLInputElement).value);
          }
        },
        keydown: {
          '[data-role="todo-input"]': (event) => {
            if (event.key === "Enter") {
              commitTodo();
            }
          }
        },
        click: {
          '[data-action="add"]': () => commitTodo(),
          '[data-filter="all"]': () => filter.set("all"),
          '[data-filter="active"]': () => filter.set("active"),
          '[data-filter="done"]': () => filter.set("done"),
          "[data-toggle-id]": (_event, matched) => toggleTodo(Number(matched.getAttribute("data-toggle-id"))),
          "[data-remove-id]": (_event, matched) => removeTodo(Number(matched.getAttribute("data-remove-id"))),
          '[data-action="clear-done"]': () => {
            todos.set(todos.get().filter((item) => !item.done));
          }
        }
      });
    }

    override disconnectedCallback(): void {
      this.stopDelegatedEvents?.();
      this.stopDelegatedEvents = undefined;
      super.disconnectedCallback();
    }

    protected override createRenderRoot() {
      return this;
    }

    override render() {
      const items = visibleTodos.get();
      const stats = totals.get();
      const activeFilter = filter.get();

      return html`
        <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
          <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
            <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">Client app</div>
            <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Mini todo flow inside Lito</h2>
            <div style="display: flex; gap: 10px; margin-top: 22px;">
              <input
                data-role="todo-input"
                .value=${inputValue.get()}
                placeholder="Add framework task"
                style="flex: 1; min-width: 0; padding: 12px 16px; border-radius: 18px; border: 1px solid rgba(148, 163, 184, 0.22); background: rgba(2, 6, 23, 0.76); color: #e5eefb; font: inherit;"
              />
              <button data-action="add" style=${pillButton("#0ea5e9", "#082f49")}>Add</button>
            </div>

            <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
              ${renderFilterButton("all", `All ${stats.total}`, activeFilter)}
              ${renderFilterButton("active", `Active ${stats.active}`, activeFilter)}
              ${renderFilterButton("done", `Done ${stats.done}`, activeFilter)}
            </div>

            <div style="display: grid; gap: 10px; margin-top: 20px;">
              ${items.map(
                (todo) => html`
                  <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 14px 16px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                    <button data-toggle-id=${String(todo.id)} style=${pillButton(todo.done ? "#f59e0b" : "#0f172a", todo.done ? "#451a03" : "#dbe7f5")}>
                      ${todo.done ? "Done" : "Open"}
                    </button>
                    <div style=${todo.done ? "color: #94a3b8; text-decoration: line-through;" : "color: #e5eefb;"}>${todo.text}</div>
                    <button data-remove-id=${String(todo.id)} style=${pillButton("transparent", "#fecaca", "1px solid rgba(248, 113, 113, 0.55)")}>Delete</button>
                  </div>
                `
              )}
            </div>

            ${stats.done > 0
              ? html`<div style="margin-top: 18px;"><button data-action="clear-done" style=${pillButton("#0f172a", "#dbe7f5")}>Clear done</button></div>`
              : null}
          </div>
        </section>
      `;
    }
  }

  customElements.define(tagName, LitoDemoTodos);
}

const page: LitoPageModule = {
  config: {
    ssr: false
  },
  document: {
    title: "Todos | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  render: () => html`<lito-demo-todos></lito-demo-todos>`
};

export default page;

function commitTodo() {
  const nextText = inputValue.get().trim();
  if (!nextText) {
    return;
  }

  todos.set([...todos.get(), { id: nextId++, text: nextText, done: false }]);
  inputValue.set("");
}

function toggleTodo(id: number) {
  todos.set(todos.get().map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
}

function removeTodo(id: number) {
  todos.set(todos.get().filter((item) => item.id !== id));
}

function renderFilterButton(value: "all" | "active" | "done", label: string, activeFilter: "all" | "active" | "done") {
  return html`
    <button data-filter=${value} style=${pillButton(activeFilter === value ? "#f59e0b" : "#0f172a", activeFilter === value ? "#451a03" : "#dbe7f5")}>
      ${label}
    </button>
  `;
}

function pillButton(background: string, color: string, border = "1px solid rgba(148, 163, 184, 0.2)") {
  return [
    `background: ${background}`,
    `color: ${color}`,
    `border: ${border}`,
    "padding: 10px 14px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
````

## File: playgrounds/demo-state/app/pages/_index.ts
````typescript
import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const cards = [
  {
    href: "/counter",
    title: "Counter",
    subtitle: "signal + memo + watch",
    body: "Client-only state page rendered through Lito's browser runtime."
  },
  {
    href: "/store",
    title: "Store",
    subtitle: "store + batch + delegated events",
    body: "Object-shaped app state with updates routed through @lito/core."
  },
  {
    href: "/todos",
    title: "Todos",
    subtitle: "interactive mini app",
    body: "A larger client-only page that keeps all interaction inside the framework primitives."
  },
  {
    href: "/server-data",
    title: "Server Data",
    subtitle: "SSR + API route",
    body: "Loads typed API data on the server to show the full-stack path end to end."
  }
];

const page: LitoPageModule = {
  document: {
    title: "Lito Demo State",
    styles: [`
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "IBM Plex Sans", system-ui, sans-serif; }
      a:hover { border-color: rgba(245, 158, 11, 0.6) !important; transform: translateY(-1px); }
    `]
  },
  render: ({ layoutData }) => html`
    <main style="max-width: 1120px; margin: 0 auto; padding: 40px 24px 80px;">
      <section style="display: grid; gap: 18px; grid-template-columns: 1.3fr 0.9fr; align-items: start;">
        <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.18);">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: rgba(14, 165, 233, 0.14); color: #7dd3fc; font-size: 0.82rem;">
            @lito/app + @lito/core + @lito/server
          </div>
          <h2 style="margin: 16px 0 10px; font-size: 3rem; line-height: 1.02;">State demo rebuilt as a real Lito app</h2>
          <p style="margin: 0; max-width: 760px; color: #b9c7da; font-size: 1.05rem; line-height: 1.7;">
            This playground uses Lito layout loading, file-based pages, typed API routes, client boot,
            and CSR-only interactive screens. The overview page stays SSR, while the state-heavy pages opt
            into <code>config.ssr = false</code> so browser state and events live entirely on the client.
          </p>
        </div>
        <div style="padding: 24px; border-radius: 24px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.14), rgba(14, 165, 233, 0.08)); border: 1px solid rgba(148, 163, 184, 0.16);">
          <div style="font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; color: #fcd34d;">Layout Data</div>
          <div style="margin-top: 12px; color: #dbe7f5; line-height: 1.8;">
            <div>App: ${String((layoutData.root as { appName?: string })?.appName ?? "Lito Demo State")}</div>
            <div>Sections: ${String((layoutData.root as { sections?: unknown[] })?.sections?.length ?? 0)}</div>
            <div>Mode mix: SSR shell + CSR pages + API route</div>
          </div>
        </div>
      </section>

      <section style="display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 24px;">
        ${cards.map(
          (card) => html`
            <a
              href=${card.href}
              style="display: block; text-decoration: none; color: inherit; padding: 22px; border-radius: 22px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16); transition: transform 0.18s ease, border-color 0.18s ease;"
            >
              <div style="font-size: 0.84rem; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.12em;">${card.subtitle}</div>
              <h3 style="margin: 10px 0 8px; font-size: 1.45rem;">${card.title}</h3>
              <p style="margin: 0; color: #b9c7da; line-height: 1.65;">${card.body}</p>
            </a>
          `
        )}
      </section>
    </main>
  `
};

export default page;
````

## File: playgrounds/demo-state/app/pages/_layout.ts
````typescript
import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const sections = [
  { href: "/", label: "Overview", kind: "SSR shell" },
  { href: "/counter", label: "Counter", kind: "CSR state" },
  { href: "/store", label: "Store", kind: "CSR store" },
  { href: "/todos", label: "Todos", kind: "CSR app" },
  { href: "/server-data", label: "Server Data", kind: "SSR + API" }
];

const layout: LitoLayoutModule<{ appName: string; sections: typeof sections }> = {
  load: () => ({
    appName: "Lito Demo State",
    sections
  }),
  render: ({ children, data }) => html`
    <div style="min-height: 100vh; background:
      radial-gradient(circle at top, rgba(245, 158, 11, 0.18), transparent 26%),
      radial-gradient(circle at left, rgba(14, 165, 233, 0.18), transparent 30%),
      #07111f;
      color: #e5eefb;">
      <header style="border-bottom: 1px solid rgba(148, 163, 184, 0.18); backdrop-filter: blur(12px);">
        <div style="max-width: 1120px; margin: 0 auto; padding: 20px 24px 18px;">
          <div style="display: flex; justify-content: space-between; gap: 18px; align-items: center; flex-wrap: wrap;">
            <div>
              <div style="font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase; color: #f59e0b;">Framework Playground</div>
              <h1 style="margin: 6px 0 0; font-size: 1.5rem;">${data.appName}</h1>
            </div>
            <nav style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${data.sections.map(
                (section) => html`
                  <a
                    href=${section.href}
                    style="padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.2); color: #dbe7f5; text-decoration: none; font-size: 0.9rem;"
                  >
                    ${section.label}
                  </a>
                `
              )}
            </nav>
          </div>
        </div>
      </header>
      ${children}
    </div>
  `
};

export default layout;
````

## File: playgrounds/demo-state/src/generated/.gitkeep
````

````

## File: playgrounds/demo-state/src/generated/api-manifest.ts
````typescript
export const apiModulePaths = [
  "../../app/api/catalog.ts",
  "../../app/api/health.ts"
] as const;
````

## File: playgrounds/demo-state/src/generated/page-manifest.ts
````typescript
import type { LitoPageManifestEntry } from "@lito/app";

export const pageManifest: LitoPageManifestEntry[] = [
  {
    page: () => import("../../app/pages/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "index",
    routePath: "/"
  },
  {
    page: () => import("../../app/pages/counter/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "counter",
    routePath: "/counter"
  },
  {
    page: () => import("../../app/pages/server-data/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "server-data",
    routePath: "/server-data"
  },
  {
    page: () => import("../../app/pages/store/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "store",
    routePath: "/store"
  },
  {
    page: () => import("../../app/pages/todos/_index.ts"),
    layouts: [{ key: "root", loader: () => import("../../app/pages/_layout.ts") }],
    routeId: "todos",
    routePath: "/todos"
  }
];
````

## File: playgrounds/demo-state/src/main.ts
````typescript
import { bootLitoClient } from "@lito/app";
import { pageManifest } from "./generated/page-manifest.js";

bootLitoClient({ pageManifest });
````

## File: playgrounds/demo-state/index.html
````html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lito Demo State</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
````

## File: playgrounds/demo-state/package.json
````json
{
  "name": "demo-state",
  "private": true,
  "type": "module",
  "scripts": {
    "generate:routes": "pnpm exec lito generate routes --root .",
    "dev": "pnpm exec lito dev --root .",
    "build": "pnpm exec lito build --root .",
    "start": "pnpm exec lito start --root ."
  },
  "dependencies": {
    "@lito/app": "workspace:*",
    "@lito/core": "workspace:*",
    "@lito/server": "workspace:*",
    "lit": "^3.2.0"
  },
  "devDependencies": {
    "@lito/cli": "workspace:*",
    "tsx": "^4.19.2",
    "typescript": "^5.8.3",
    "vite": "^5.4.19"
  }
}
````

## File: playgrounds/demo-state/server.ts
````typescript
import { scanApiRoutesFromManifest, scanPageRoutesFromManifest } from "@lito/app";
import { startLitoNodeApp } from "@lito/server";
import { resolve } from "node:path";
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
  appName: "Lito Demo State",
  rootDir: resolve(process.cwd()),
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  port: Number(process.env.PORT ?? 3000),
  pages,
  apiRoutes
});

console.log(`Lito demo-state is running at http://localhost:${process.env.PORT ?? 3000}`);
````

## File: playgrounds/demo-state/tsconfig.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "noEmit": true,
    "allowImportingTsExtensions": true
  },
  "include": ["src/**/*.ts", "app/**/*.ts", "server.ts", "vite.config.ts"]
}
````

## File: playgrounds/demo-state/vite.config.ts
````typescript
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  resolve: {
    alias: {
      "@lito/app": resolve(__dirname, "../../packages/app/src/index.ts"),
      "@lito/core": resolve(__dirname, "../../packages/core/src/index.ts"),
      "@lito/server": resolve(__dirname, "../../packages/server/src/index.ts")
    }
  },
  optimizeDeps: {
    exclude: ["@lito/app", "@lito/core", "@lito/server"]
  },
  plugins: [
    {
      name: "lito-protect-api",
      enforce: "pre",
      resolveId(id, importer, options) {
        if (!options?.ssr && (id.includes("/app/api/") || id.endsWith("/app/api"))) {
          throw new Error(
            `\n\n[LITO] Protection Error:\nCannot import backend API route '${id}' in a Client context!\n(Imported by ${importer})\n\n`
          );
        }
      }
    }
  ],
  build: {
    manifest: "manifest.json"
  }
});
````

## File: .gitignore
````
node_modules
dist
.DS_Store
.idea
.vscode
coverage
````

## File: package.json
````json
{
  "name": "lito",
  "private": true,
  "version": "0.1.0",
  "description": "Lito monorepo scaffold",
  "packageManager": "pnpm@10.0.0",
  "workspaces": [
    "packages/*",
    "playgrounds/*"
  ],
  "scripts": {
    "build": "tsc -b packages/core packages/router packages/server packages/app packages/cli packages/testing",
    "typecheck": "tsc -b packages/core packages/router packages/server packages/app packages/cli packages/testing",
    "test": "pnpm build && pnpm --filter @lito/testing test",
    "clean": "rm -rf packages/*/dist playgrounds/*/dist"
  },
  "devDependencies": {
    "@lito/cli": "workspace:*",
    "@types/node": "^22.15.3",
    "typescript": "^5.8.3"
  }
}
````

## File: pnpm-workspace.yaml
````yaml
packages:
  - "packages/*"
  - "playgrounds/*"
  - 'playgrounds/*'
````

## File: README.md
````markdown
# Lito

Lito is an experimental full-stack framework built around Lit, SSR, routing, and a small package-first architecture.

## Workspace Layout

```txt
packages/
  core/
  router/
  server/
  app/
  cli/
  testing/
planning/
  PLANNING.md
```

## Getting Started

1. Install dependencies with `pnpm install`.
2. Create a new app with `pnpm exec lito new my-app`.
3. Move into the new app and run `pnpm install`.
4. Start development with `pnpm dev`.

## Current Status

This repository contains the package-first Lito monorepo with CLI, routing, SSR server runtime, app contracts, and testing baseline.
````

## File: tsconfig.base.json
````json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "declaration": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true
  }
}
````
