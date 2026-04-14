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
