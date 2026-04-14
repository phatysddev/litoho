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
