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
    id: "use-client",
    title: "\"use client\"",
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
