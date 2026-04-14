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

