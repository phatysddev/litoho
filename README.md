# Lito

Lito is an experimental full-stack framework built around Lit, file-based routing, SSR, and a small package-first architecture.

This README reflects the `0.0.1` milestone: the first usable monorepo snapshot with a working CLI, page routing, server rendering, client-only pages, typed API routes, and playground apps.

## What Lito Is

Lito is aiming for a simple mental model:

- use Lit for UI
- use folder-based routing for pages and APIs
- use `"use client"` and `"use server"` directives to describe page mode
- use one Node server for SSR pages, APIs, and Vite in development
- keep the framework split into focused packages instead of one large runtime

## 0.0.1 Features

- Lit-based full-stack app model
- File-based page routing from `app/pages`
- File-based API routing from `app/api`
- Nested layouts with `_layout.ts`
- Special pages with `_not-found.ts` and `_error.ts`
- SSR page rendering through `@lito/server`
- Client-only page mode through top-level `"use client"`
- Server-intent page mode through top-level `"use server"`
- Typed query parsing for API routes
- Route manifest generation
- CLI scaffolding for pages, APIs, layouts, and resources
- A lightweight reactive core with `signal()`, `memo()`, `watch()`, `batch()`, and `store()`

## Monorepo Layout

```txt
packages/
  app/        App contracts, manifest loading, client boot
  cli/        lito CLI
  core/       Reactive primitives and shared frontend runtime helpers
  router/     Route matching and resolution
  server/     SSR server runtime and Node app integration
  testing/    Framework test baseline

playgrounds/
  demo-app/
  demo-hydration/
  demo-state/

planning/
  PLANNING.md
```

## Package Overview

- `@lito/core`
  Reactive state primitives and shared frontend building blocks.
- `@lito/app`
  Page/layout module contracts, manifest loading, hydration helpers, and browser boot.
- `@lito/router`
  Route matching utilities for static and dynamic segments.
- `@lito/server`
  Hono-based server runtime, SSR document rendering, typed API helpers, and Node integration.
- `@lito/cli`
  Project scaffolding, route manifest generation, dev/build/start commands, and doctor checks.
- `@lito/testing`
  Test coverage for manifests, router behavior, SSR, and state primitives.

## Page Conventions

Lito uses folder-based pages.

Allowed files in `app/pages`:

- `_index.ts`
- `_layout.ts`
- `_not-found.ts`
- `_error.ts`

Examples:

```txt
app/pages/_index.ts
app/pages/docs/_layout.ts
app/pages/docs/getting-started/_index.ts
app/pages/products/[id]/_index.ts
```

Page mode is directive-based:

```ts
"use client";
```

Use `"use client";` for interactive pages that should mount on the browser without SSR page HTML.

```ts
"use server";
```

Use `"use server";` when you want to mark a page as server-rendered explicitly. If no directive is present, the route behaves as a server page by default.

## API Conventions

API routes live in `app/api`.

Examples:

```txt
app/api/health.ts
app/api/products.ts
app/api/products/[id].ts
app/api/_middleware.ts
```

You can define typed query parsing with `defineApiRoute()` from `@lito/server`.

## Quick Start In This Repo

1. Install dependencies:

```bash
pnpm install
```

2. Build the framework packages:

```bash
pnpm build
```

3. Run tests:

```bash
pnpm --filter @lito/testing test
```

4. Start a playground app:

```bash
cd playgrounds/demo-state
pnpm dev
```

The default local URL is `http://localhost:3000`.

## Create A New App

From the repo root:

```bash
pnpm exec lito new my-app
cd my-app
pnpm install
pnpm dev
```

Generated apps include:

- `app/pages`
- `app/api`
- `src/main.ts`
- `server.ts`
- `vite.config.ts`

## CLI

Main commands available in `0.0.1`:

```bash
lito new <name>
lito dev [--root <dir>]
lito build [--root <dir>]
lito start [--root <dir>]
lito doctor [--root <dir>]
lito generate routes [--root <dir>]
```

Generate helpers:

```bash
lito g p docs/getting-started
lito g p products --params id
lito g a users --params id
lito g a products --params id --query q:number,draft:boolean,tag:strings
lito g l docs
lito g r products
```

## Example Page

```ts
"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { memo, signal, watch } from "@lito/core";

const count = signal(0);
const doubled = memo(() => count.value * 2);

watch(() => {
  console.log("count:", count.value, "doubled:", doubled.value);
}, [count, doubled]);

const page: LitoPageModule = {
  document: {
    title: "Counter"
  },
  render: () => html`
    <main>
      <h1>${count.value}</h1>
      <p>Doubled: ${doubled.value}</p>
      <button @click=${() => (count.value += 1)}>Increment</button>
    </main>
  `
};

export default page;
```

## Example API Route

```ts
import { defineApiRoute } from "@lito/server";

export default defineApiRoute({
  query: {
    q: "number"
  },
  get({ params, queryData }) {
    return Response.json({
      ok: true,
      params,
      query: queryData
    });
  }
});
```

## Current Status

`0.0.1` is still an early framework snapshot. The core developer flow works, but the project is still evolving and some conventions may tighten as Lito moves toward a more stable release.

Things that are already solid enough to explore:

- building apps with Lit pages
- mixing SSR and client-only pages
- generating routes and scaffolds with the CLI
- using typed APIs and nested layouts
- experimenting with the Lito state primitives

## Development Notes

- The repo uses `pnpm` workspaces.
- Root build uses TypeScript project references.
- Playgrounds are the best place to validate framework behavior before changing public contracts.
- `lito doctor` helps catch invalid page file conventions.

## Roadmap

The working roadmap lives in [planning/PLANNING.md](/Users/yodsaveesupachoktanasap/Desktop/lito/planning/PLANNING.md).

## License

No license has been added yet.
