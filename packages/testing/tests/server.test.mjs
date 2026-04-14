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
