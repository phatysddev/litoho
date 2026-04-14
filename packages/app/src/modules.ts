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

export type LitoPageModule<Data = unknown, ActionData = unknown> = {
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
