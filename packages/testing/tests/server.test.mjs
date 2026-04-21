import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  appendCookie,
  badRequest,
  createCookieHeader,
  createCspHeader,
  createCsrfCookie,
  createCsrfToken,
  createLitoServer,
  createSecureCookieHeader,
  deleteCookie,
  defineApiRoute,
  forbidden,
  html,
  json,
  methodNotAllowed,
  notFound,
  readJsonBody,
  redirect,
  requireAuth,
  requireRole,
  setCookie,
  setSecureCookie,
  unauthorized,
  withCacheControl,
  withBodyLimit,
  withCors,
  withCsrf,
  withCsp,
  withJsonBody,
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

test("createLitoServer only trusts forwarded headers when trustedProxy is enabled", async () => {
  const createProxyInfoRoute = () => ({
    id: "api:proxy",
    path: "/api/proxy",
    ...defineApiRoute({
      get: (context) =>
        json({
          clientIp: context.clientIp ?? null,
          forwardedFor: context.proxy.forwardedFor,
          host: context.host,
          protocol: context.protocol
        })
    })
  });
  const untrustedApp = createLitoServer({
    appName: "Litoho Test",
    apiRoutes: [createProxyInfoRoute()]
  });
  const trustedApp = createLitoServer({
    appName: "Litoho Test",
    trustedProxy: true,
    apiRoutes: [createProxyInfoRoute()]
  });
  const oneHopApp = createLitoServer({
    appName: "Litoho Test",
    trustedProxy: {
      hops: 1
    },
    apiRoutes: [createProxyInfoRoute()]
  });

  const headers = {
    "x-forwarded-for": "203.0.113.10, 10.0.0.2",
    "x-forwarded-host": "app.example.com",
    "x-forwarded-proto": "https"
  };
  const untrusted = await untrustedApp.fetch(new Request("http://internal.test/api/proxy", { headers }));
  const trusted = await trustedApp.fetch(new Request("http://internal.test/api/proxy", { headers }));
  const oneHop = await oneHopApp.fetch(new Request("http://internal.test/api/proxy", { headers }));

  assert.deepEqual(await untrusted.json(), {
    clientIp: null,
    forwardedFor: [],
    host: "internal.test",
    protocol: "http"
  });
  assert.deepEqual(await trusted.json(), {
    clientIp: "203.0.113.10",
    forwardedFor: ["203.0.113.10", "10.0.0.2"],
    host: "app.example.com",
    protocol: "https"
  });
  assert.equal((await oneHop.json()).clientIp, "203.0.113.10");
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

test("withBodyLimit rejects oversized requests and preserves allowed bodies", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withBodyLimit({
        maxBytes: 8
      })
    ],
    apiRoutes: [
      {
        id: "api:body",
        path: "/api/body",
        ...defineApiRoute({
          post: async (context) => {
            const body = await context.request.text();
            return json({
              ok: true,
              body
            });
          }
        })
      }
    ]
  });

  const allowed = await app.fetch(
    new Request("http://litoho.test/api/body", {
      method: "POST",
      body: "small"
    })
  );
  const deniedByLength = await app.fetch(
    new Request("http://litoho.test/api/body", {
      method: "POST",
      body: "too-large-body"
    })
  );
  const deniedBody = await deniedByLength.json();

  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), {
    ok: true,
    body: "small"
  });
  assert.equal(deniedByLength.status, 413);
  assert.equal(deniedBody.error.message, "Payload Too Large");
  assert.equal(deniedBody.error.limit, 8);
});

test("withBodyLimit can measure chunked bodies without content-length", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode("hello"));
      controller.enqueue(new TextEncoder().encode(" world"));
      controller.close();
    }
  });
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withBodyLimit({
        maxBytes: 6,
        response: ({ limit, received }) =>
          json(
            {
              ok: false,
              limit,
              received
            },
            {
              status: 422
            }
          )
      })
    ],
    apiRoutes: [
      {
        id: "api:chunked",
        path: "/api/chunked",
        ...defineApiRoute({
          post: async (context) => json({ body: await context.request.text() })
        })
      }
    ]
  });

  const response = await app.fetch(
    new Request("http://litoho.test/api/chunked", {
      method: "POST",
      body: stream,
      duplex: "half"
    })
  );
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.deepEqual(body, {
    ok: false,
    limit: 6,
    received: 11
  });
});

test("withJsonBody parses safe JSON bodies and preserves downstream request body", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withJsonBody({
        maxBytes: 128
      })
    ],
    apiRoutes: [
      {
        id: "api:json",
        path: "/api/json",
        ...defineApiRoute({
          post: async (context) =>
            json({
              parsed: readJsonBody(context),
              raw: await context.request.text()
            })
        })
      }
    ]
  });

  const response = await app.fetch(
    new Request("http://litoho.test/api/json", {
      method: "POST",
      body: JSON.stringify({ name: "Litoho", count: 2 }),
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    })
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.parsed, {
    name: "Litoho",
    count: 2
  });
  assert.equal(body.raw, "{\"name\":\"Litoho\",\"count\":2}");
});

test("withJsonBody rejects unsupported, invalid, and oversized JSON requests", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withJsonBody({
        maxBytes: 8,
        required: true
      })
    ],
    apiRoutes: [
      {
        id: "api:json-guard",
        path: "/api/json-guard",
        ...defineApiRoute({
          post: () => json({ ok: true })
        })
      }
    ]
  });

  const unsupported = await app.fetch(
    new Request("http://litoho.test/api/json-guard", {
      method: "POST",
      body: "plain",
      headers: {
        "content-type": "text/plain"
      }
    })
  );
  const invalid = await app.fetch(
    new Request("http://litoho.test/api/json-guard", {
      method: "POST",
      body: "{x",
      headers: {
        "content-type": "application/json"
      }
    })
  );
  const oversized = await app.fetch(
    new Request("http://litoho.test/api/json-guard", {
      method: "POST",
      body: JSON.stringify({ too: "large" }),
      headers: {
        "content-type": "application/json"
      }
    })
  );

  assert.equal(unsupported.status, 415);
  assert.equal((await unsupported.json()).error.reason, "unsupported-content-type");
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.reason, "invalid-json");
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error.reason, "payload-too-large");
});

test("withJsonBody supports custom +json content types and response hooks", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withJsonBody({
        response: ({ reason, status }) =>
          json(
            {
              custom: true,
              reason
            },
            {
              status
            }
          )
      })
    ],
    apiRoutes: [
      {
        id: "api:problem-json",
        path: "/api/problem-json",
        ...defineApiRoute({
          post: (context) => json({ parsed: readJsonBody(context) })
        })
      }
    ]
  });

  const accepted = await app.fetch(
    new Request("http://litoho.test/api/problem-json", {
      method: "POST",
      body: JSON.stringify({ ok: true }),
      headers: {
        "content-type": "application/problem+json"
      }
    })
  );
  const rejected = await app.fetch(
    new Request("http://litoho.test/api/problem-json", {
      method: "POST",
      body: "not-json",
      headers: {
        "content-type": "application/json"
      }
    })
  );

  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), {
    parsed: {
      ok: true
    }
  });
  assert.equal(rejected.status, 400);
  assert.deepEqual(await rejected.json(), {
    custom: true,
    reason: "invalid-json"
  });
});

test("withCsrf issues a token cookie and protects mutation requests", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withCsrf({
        tokenGenerator: () => "csrf-fixed"
      })
    ],
    apiRoutes: [
      {
        id: "api:csrf",
        path: "/api/csrf",
        ...defineApiRoute({
          get: () => json({ ok: true }),
          post: () => json({ ok: true, mutated: true })
        })
      }
    ],
    pages: [
      {
        id: "home",
        path: "/",
        render: (context) => `csrf:${String(context.getLocal("csrf.token"))}`
      }
    ]
  });

  const initial = await app.fetch(new Request("http://litoho.test/"));
  const setCookie = initial.headers.get("set-cookie") ?? "";
  const denied = await app.fetch(new Request("http://litoho.test/api/csrf", { method: "POST" }));
  const allowed = await app.fetch(
    new Request("http://litoho.test/api/csrf", {
      method: "POST",
      headers: {
        cookie: "litoho.csrf=csrf-fixed",
        "x-csrf-token": "csrf-fixed"
      }
    })
  );
  const mismatched = await app.fetch(
    new Request("http://litoho.test/api/csrf", {
      method: "POST",
      headers: {
        cookie: "litoho.csrf=csrf-fixed",
        "x-csrf-token": "wrong"
      }
    })
  );

  assert.equal(initial.status, 200);
  assert.match(setCookie, /litoho\.csrf=csrf-fixed/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.equal(denied.status, 403);
  assert.equal(await denied.text(), "Invalid CSRF token");
  assert.equal(allowed.status, 200);
  assert.deepEqual(await allowed.json(), { ok: true, mutated: true });
  assert.equal(mismatched.status, 403);
});

test("withCsrf accepts form token sources and supports cookie helpers", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withCsrf({
        tokenSources: ["form"],
        tokenGenerator: () => "form-token"
      })
    ],
    apiRoutes: [
      {
        id: "api:form",
        path: "/api/form",
        ...defineApiRoute({
          post: () => json({ ok: true })
        })
      }
    ]
  });

  const response = await app.fetch(
    new Request("http://litoho.test/api/form", {
      method: "POST",
      body: new URLSearchParams({
        _csrf: "form-token"
      }),
      headers: {
        cookie: "litoho.csrf=form-token",
        "content-type": "application/x-www-form-urlencoded"
      }
    })
  );
  const token = createCsrfToken();
  const cookie = createCsrfCookie("abc", { secure: true });
  const customCookie = createCookieHeader("session", "value", { httpOnly: true, sameSite: "Strict" });

  assert.equal(response.status, 200);
  assert.ok(token.length >= 22);
  assert.match(cookie, /litoho\.csrf=abc/);
  assert.match(cookie, /Secure/);
  assert.match(customCookie, /HttpOnly/);
  assert.match(customCookie, /SameSite=Strict/);
});

test("secure cookie helpers create, append, set, and delete cookies", async () => {
  const secureCookie = createSecureCookieHeader("session", "abc", {
    maxAge: 60
  });
  const insecureCookie = createCookieHeader("theme", "sea", {
    sameSite: "Lax",
    secure: false
  });
  const responseWithAppend = appendCookie(new Response("ok"), insecureCookie);
  const responseWithSet = setCookie(new Response("ok"), "theme", "forest", {
    sameSite: "Strict"
  });
  const responseWithSecureSet = setSecureCookie(new Response("ok"), "session", "next", {
    path: "/admin"
  });
  const responseWithDelete = deleteCookie(new Response("ok"), "session", {
    httpOnly: true,
    secure: true
  });

  assert.match(secureCookie, /session=abc/);
  assert.match(secureCookie, /HttpOnly/);
  assert.match(secureCookie, /Secure/);
  assert.match(secureCookie, /SameSite=Lax/);
  assert.match(secureCookie, /Max-Age=60/);
  assert.match(responseWithAppend.headers.get("set-cookie") ?? "", /theme=sea/);
  assert.match(responseWithSet.headers.get("set-cookie") ?? "", /theme=forest/);
  assert.match(responseWithSet.headers.get("set-cookie") ?? "", /SameSite=Strict/);
  assert.match(responseWithSecureSet.headers.get("set-cookie") ?? "", /session=next/);
  assert.match(responseWithSecureSet.headers.get("set-cookie") ?? "", /Path=\/admin/);
  assert.match(responseWithDelete.headers.get("set-cookie") ?? "", /session=/);
  assert.match(responseWithDelete.headers.get("set-cookie") ?? "", /Max-Age=0/);
  assert.match(responseWithDelete.headers.get("set-cookie") ?? "", /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.throws(() => createCookieHeader("unsafe", "value", { path: "/; injected=true" }), /Cookie path/);
  assert.throws(() => createCookieHeader("unsafe", "value", { domain: "example.com\r\nx: y" }), /Cookie domain/);
});

test("createCspHeader builds CSP directives from camelCase and kebab-case keys", () => {
  const header = createCspHeader({
    directives: {
      scriptSrc: ["'self'", "https://cdn.example.com"],
      "img-src": ["'self'", "data:"],
      upgradeInsecureRequests: true,
      objectSrc: false
    }
  });

  assert.match(header, /default-src 'self'/);
  assert.match(header, /script-src 'self' https:\/\/cdn\.example\.com/);
  assert.match(header, /img-src 'self' data:/);
  assert.match(header, /upgrade-insecure-requests/);
  assert.doesNotMatch(header, /object-src/);
});

test("withCsp applies CSP middleware and supports report-only mode", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withCsp({
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "https://api.example.com"]
        }
      })
    ],
    apiRoutes: [
      {
        id: "api:csp",
        path: "/api/csp",
        ...defineApiRoute({
          get: () => json({ ok: true })
        })
      }
    ]
  });
  const reportOnlyApp = createLitoServer({
    appName: "Litoho Test",
    middlewares: [
      withCsp({
        directives: {
          defaultSrc: ["'self'"]
        },
        reportOnly: true
      })
    ],
    pages: [
      {
        id: "home",
        path: "/",
        render: () => "home"
      }
    ]
  });

  const response = await app.fetch(new Request("http://litoho.test/api/csp"));
  const reportOnlyResponse = await reportOnlyApp.fetch(new Request("http://litoho.test/"));

  assert.match(response.headers.get("content-security-policy") ?? "", /connect-src 'self' https:\/\/api\.example\.com/);
  assert.equal(reportOnlyResponse.headers.get("content-security-policy"), null);
  assert.match(reportOnlyResponse.headers.get("content-security-policy-report-only") ?? "", /default-src 'self'/);
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

test("createLitoServer applies default security headers and can opt out", async () => {
  const securedApp = createLitoServer({
    appName: "Litoho Test",
    apiRoutes: [
      {
        id: "api:secure",
        path: "/api/secure",
        ...defineApiRoute({
          get: () => json({ ok: true })
        })
      }
    ],
    pages: [
      {
        id: "home",
        path: "/",
        render: () => "secure home"
      }
    ]
  });
  const optedOutApp = createLitoServer({
    appName: "Litoho Test",
    securityHeaders: false,
    pages: [
      {
        id: "home",
        path: "/",
        render: () => "plain home"
      }
    ]
  });

  const pageResponse = await securedApp.fetch(new Request("http://litoho.test/"));
  const apiResponse = await securedApp.fetch(new Request("http://litoho.test/api/secure"));
  const optedOutResponse = await optedOutApp.fetch(new Request("http://litoho.test/"));

  assert.equal(pageResponse.headers.get("x-frame-options"), "DENY");
  assert.equal(pageResponse.headers.get("x-content-type-options"), "nosniff");
  assert.equal(pageResponse.headers.get("referrer-policy"), "no-referrer");
  assert.equal(pageResponse.headers.get("x-xss-protection"), "0");
  assert.equal(apiResponse.headers.get("x-frame-options"), "DENY");
  assert.equal(optedOutResponse.headers.get("x-frame-options"), null);
});

test("redirect rejects unsafe locations and invalid statuses", () => {
  assert.equal(redirect("/login").headers.get("location"), "/login");
  assert.equal(redirect("https://litoho.dev/docs", 303).status, 303);
  assert.throws(() => redirect("javascript:alert(1)"), /Unsafe redirect protocol/);
  assert.throws(() => redirect("//evil.test/login"), /Protocol-relative redirects/);
  assert.throws(() => redirect("/login\r\nset-cookie:owned=true"), /Unsafe redirect location/);
  assert.throws(() => redirect("/login", 200), /Invalid redirect status/);
});

test("SSR data serialization escapes script-breaking characters", async () => {
  const app = createLitoServer({
    appName: "Litoho Test",
    pages: [
      {
        id: "home",
        path: "/",
        load: () => ({
          payload: "</script><script>window.__owned=true</script>",
          ampersand: "&",
          lineSeparator: "\u2028"
        }),
        render: () => "safe"
      }
    ]
  });

  const response = await app.fetch(new Request("http://litoho.test/"));
  const body = await response.text();

  assert.match(body, /\\u003c\/script\\u003e/);
  assert.match(body, /\\u0026/);
  assert.match(body, /\\u2028/);
  assert.doesNotMatch(body, /<script>window\.__owned=true<\/script>/);
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
    const traversalResponse = await app.fetch(new Request("http://litoho.test/%2e%2e/package.json"));
    const pageResponse = await app.fetch(new Request("http://litoho.test/"));

    assert.equal(logoResponse.status, 200);
    assert.equal(await logoResponse.text(), "brand-mark");
    assert.equal(robotsResponse.status, 200);
    assert.match(await robotsResponse.text(), /User-agent: \*/);
    assert.equal(imageResponse.status, 200);
    assert.match(imageResponse.headers.get("content-type") ?? "", /image\/svg\+xml/);
    assert.equal(imageResponse.headers.get("x-content-type-options"), "nosniff");
    assert.notEqual(traversalResponse.status, 200);
    assert.equal(pageResponse.status, 200);
    assert.match(await pageResponse.text(), /home/);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
