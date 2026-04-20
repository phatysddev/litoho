import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  badRequest,
  createLitoServer,
  defineApiRoute,
  forbidden,
  html,
  json,
  methodNotAllowed,
  notFound,
  redirect,
  requireAuth,
  requireRole,
  unauthorized,
  withCacheControl,
  withCors,
  withRequestId,
  withSecurityHeaders,
  withRateLimit
} from "../../server/dist/index.js";

test("createLitoServer renders SSR pages with middleware-provided request locals", async () => {
  const logs = [];
  const app = createLitoServer({
    appName: "Litoho Test",
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
    new Request("http://litoho.test/?source=middleware", {
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
    /window\.__LITOHO_DATA__=\{"pageData":\{"requestId":"req-123","source":"middleware","cookieTheme":"sea","startedAt":\d+\}\}/
  );
  assert.deepEqual(logs[0], "start:/");
  assert.match(logs[1], /^done:\/:\d+$/);
});

test("createLitoServer renders custom 404 pages", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
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

  const response = await app.fetch(new Request("http://litoho.test/unknown"));
  const body = await response.text();

  assert.equal(response.status, 404);
  assert.match(body, /<title>Missing<\/title>/);
  assert.match(body, /missing:missing-404/);
});

test("createLitoServer renders custom 500 pages and returns JSON for API failures", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
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

  const pageResponse = await app.fetch(new Request("http://litoho.test/boom"));
  const pageBody = await pageResponse.text();
  const apiResponse = await app.fetch(new Request("http://litoho.test/api/boom"));
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
    appName: "Litoho Test",
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

  const response = await app.fetch(new Request("http://litoho.test/api/products/42?q=3&draft=true&tag=a&tag=b"));
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

test("createLitoServer short-circuits page requests with redirect and unauthorized responses", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      (context, next) => {
        if (context.pathname === "/private") {
          return redirect("http://litoho.test/login");
        }

        if (context.pathname === "/members") {
          return unauthorized("members only", {
            headers: {
              "content-type": "text/plain; charset=utf-8"
            }
          });
        }

        return next();
      }
    ],
    pages: [
      {
        id: "login",
        path: "/login",
        render: () => "login"
      },
      {
        id: "private",
        path: "/private",
        render: () => "private page body should not render"
      },
      {
        id: "members",
        path: "/members",
        render: () => "members page body should not render"
      }
    ]
  });

  const redirectResponse = await app.fetch(new Request("http://litoho.test/private"));
  const unauthorizedResponse = await app.fetch(new Request("http://litoho.test/members"));
  const unauthorizedBody = await unauthorizedResponse.text();

  assert.equal(redirectResponse.status, 302);
  assert.equal(redirectResponse.headers.get("location"), "http://litoho.test/login");
  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(unauthorizedBody, "members only");
});

test("createLitoServer short-circuits API requests with JSON 401 responses", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      (context, next) => {
        if (context.pathname === "/api/secure" && context.query.get("token") !== "demo-secret") {
          return json(
            {
              ok: false,
              error: {
                message: "Unauthorized"
              }
            },
            {
              status: 401
            }
          );
        }

        return next();
      }
    ],
    apiRoutes: [
      {
        id: "api:secure",
        path: "/api/secure",
        ...defineApiRoute({
          get: () =>
            Response.json({
              ok: true,
              secret: "demo"
            })
        })
      }
    ]
  });

  const deniedResponse = await app.fetch(new Request("http://litoho.test/api/secure"));
  const deniedBody = await deniedResponse.json();
  const allowedResponse = await app.fetch(new Request("http://litoho.test/api/secure?token=demo-secret"));
  const allowedBody = await allowedResponse.json();

  assert.equal(deniedResponse.status, 401);
  assert.deepEqual(deniedBody, {
    ok: false,
    error: {
      message: "Unauthorized"
    }
  });
  assert.equal(allowedResponse.status, 200);
  assert.deepEqual(allowedBody, {
    ok: true,
    secret: "demo"
  });
});

test("server response helpers create expected statuses and headers", async () => {
  const badRequestResponse = badRequest("bad input");
  const notFoundResponse = notFound("missing");
  const methodNotAllowedResponse = methodNotAllowed("nope");
  const forbiddenResponse = forbidden("forbidden");
  const unauthorizedResponse = unauthorized("unauthorized");
  const htmlResponse = html("<h1>Hello</h1>");
  const redirectResponse = redirect("http://litoho.test/next");
  const jsonResponse = json({ ok: true }, { status: 202 });

  assert.equal(badRequestResponse.status, 400);
  assert.equal(await badRequestResponse.text(), "bad input");
  assert.equal(notFoundResponse.status, 404);
  assert.equal(await notFoundResponse.text(), "missing");
  assert.equal(methodNotAllowedResponse.status, 405);
  assert.equal(await methodNotAllowedResponse.text(), "nope");
  assert.equal(forbiddenResponse.status, 403);
  assert.equal(await forbiddenResponse.text(), "forbidden");
  assert.equal(unauthorizedResponse.status, 401);
  assert.equal(await unauthorizedResponse.text(), "unauthorized");
  assert.equal(htmlResponse.status, 200);
  assert.equal(htmlResponse.headers.get("content-type"), "text/html; charset=utf-8");
  assert.equal(await htmlResponse.text(), "<h1>Hello</h1>");
  assert.equal(redirectResponse.status, 302);
  assert.equal(redirectResponse.headers.get("location"), "http://litoho.test/next");
  assert.equal(jsonResponse.status, 202);
  assert.deepEqual(await jsonResponse.json(), { ok: true });
});

test("requireAuth and requireRole short-circuit protected routes", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      (context, next) => {
        context.setLocal("auth.role", context.query.get("role"));
        return next();
      },
      requireAuth({
        protectedPathPrefixes: ["/protected"],
        expectedToken: "demo-secret"
      }),
      requireRole({
        protectedPathPrefixes: ["/admin"],
        requiredRoles: ["admin"],
        forbiddenResponse: forbidden("admin only")
      })
    ],
    pages: [
      {
        id: "protected",
        path: "/protected",
        render: () => "protected"
      },
      {
        id: "admin",
        path: "/admin",
        render: () => "admin"
      }
    ]
  });

  const deniedAuth = await app.fetch(new Request("http://litoho.test/protected"));
  const allowedAuth = await app.fetch(new Request("http://litoho.test/protected?token=demo-secret"));
  const deniedRole = await app.fetch(new Request("http://litoho.test/admin?role=editor"));
  const allowedRole = await app.fetch(new Request("http://litoho.test/admin?role=admin"));

  assert.equal(deniedAuth.status, 401);
  assert.equal(await deniedAuth.text(), "Unauthorized");
  assert.equal(allowedAuth.status, 200);
  assert.equal(deniedRole.status, 403);
  assert.equal(await deniedRole.text(), "admin only");
  assert.equal(allowedRole.status, 200);
});

test("withCors adds headers and handles OPTIONS preflight", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withCors({
        allowOrigin: ["https://example.com"],
        allowHeaders: ["content-type", "x-custom"],
        exposeHeaders: ["x-trace-id"],
        allowCredentials: true,
        maxAge: 600
      })
    ],
    apiRoutes: [
      {
        id: "api:cors",
        path: "/api/cors",
        ...defineApiRoute({
          get: () =>
            json(
              {
                ok: true
              },
              {
                headers: {
                  "x-trace-id": "trace-1"
                }
              }
            )
        })
      }
    ]
  });

  const preflight = await app.fetch(
    new Request("http://litoho.test/api/cors", {
      method: "OPTIONS",
      headers: {
        origin: "https://example.com"
      }
    })
  );
  const actual = await app.fetch(
    new Request("http://litoho.test/api/cors", {
      headers: {
        origin: "https://example.com"
      }
    })
  );

  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "https://example.com");
  assert.equal(actual.status, 200);
  assert.equal(actual.headers.get("access-control-allow-origin"), "https://example.com");
  assert.equal(actual.headers.get("access-control-allow-credentials"), "true");
  assert.equal(actual.headers.get("access-control-expose-headers"), "x-trace-id");
});

test("withRateLimit short-circuits requests after the configured limit", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withRateLimit({
        limit: 1,
        windowMs: 60_000,
        key: "demo-rate-limit"
      })
    ],
    apiRoutes: [
      {
        id: "api:rate",
        path: "/api/rate",
        ...defineApiRoute({
          get: () =>
            json({
              ok: true
            })
        })
      }
    ]
  });

  const first = await app.fetch(new Request("http://litoho.test/api/rate"));
  const second = await app.fetch(new Request("http://litoho.test/api/rate"));
  const secondBody = await second.json();

  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(second.headers.get("retry-after"), "60");
  assert.deepEqual(secondBody, {
    ok: false,
    error: {
      message: "Too Many Requests"
    }
  });
});

test("withSecurityHeaders, withRequestId, and withCacheControl decorate downstream responses", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withRequestId({
        generator: () => "req-fixed"
      }),
      withSecurityHeaders({
        contentSecurityPolicy: "default-src 'self'"
      }),
      withCacheControl({
        value: "private, max-age=60"
      })
    ],
    apiRoutes: [
      {
        id: "api:headers",
        path: "/api/headers",
        ...defineApiRoute({
          get: () =>
            json({
              ok: true
            })
        })
      }
    ]
  });

  const response = await app.fetch(new Request("http://litoho.test/api/headers"));

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-request-id"), "req-fixed");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-security-policy"), "default-src 'self'");
  assert.equal(response.headers.get("cache-control"), "private, max-age=60");
});

test("createLitoServer serves public assets before page routing", async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "litoho-public-assets-"));

  try {
    const publicRoot = resolve(tempRoot, "public");
    mkdirSync(resolve(publicRoot, "images"), { recursive: true });
    writeFileSync(resolve(publicRoot, "logo.txt"), "brand-mark");
    writeFileSync(resolve(publicRoot, "robots.txt"), "User-agent: *\nAllow: /\n");
    writeFileSync(resolve(publicRoot, "images/hero.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>");

    const app = createLitoServer({
      appName: "Litoho Test",
      publicRoot,
      pages: [
        {
          id: "home",
          path: "/",
          render: () => "home"
        },
        {
          id: "logo-page",
          path: "/logo.txt",
          render: () => "this page route should never win"
        }
      ]
    });

    const logoResponse = await app.fetch(new Request("http://litoho.test/logo.txt"));
    const robotsResponse = await app.fetch(new Request("http://litoho.test/robots.txt"));
    const imageResponse = await app.fetch(new Request("http://litoho.test/images/hero.svg"));
    const pageResponse = await app.fetch(new Request("http://litoho.test/"));

    assert.equal(logoResponse.status, 200);
    assert.equal(await logoResponse.text(), "brand-mark");
    assert.equal(robotsResponse.status, 200);
    assert.match(await robotsResponse.text(), /User-agent: \*/);
    assert.equal(imageResponse.status, 200);
    assert.match(imageResponse.headers.get("content-type") ?? "", /image\/svg\+xml/);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /home/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
