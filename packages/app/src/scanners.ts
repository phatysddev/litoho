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
        mode: entry.mode,
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
