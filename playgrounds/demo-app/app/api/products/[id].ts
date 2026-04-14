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
