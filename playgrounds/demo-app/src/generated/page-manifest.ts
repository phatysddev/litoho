export const pageManifest = [
  {
    "page": "../../app/pages/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "index"
  },
  {
    "page": "../../app/pages/docs/getting-started/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts",
      "../../app/pages/docs/_layout.ts"
    ],
    "routeId": "docs:getting-started"
  },
  {
    "page": "../../app/pages/products/[id]/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:[id]"
  },
  {
    "page": "../../app/pages/products/[id]/edit/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:[id]:edit"
  },
  {
    "page": "../../app/pages/products/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products"
  },
  {
    "page": "../../app/pages/products/new/_index.ts",
    "layouts": [
      "../../app/pages/_layout.ts"
    ],
    "routeId": "products:new"
  }
] as const;
