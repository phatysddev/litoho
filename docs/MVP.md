# Litoho MVP Readiness Checklist

This checklist is the release gate for the first public MVP of Litoho.

The goal is not "everything is finished." The goal is "the core developer journey works end to end and the rough edges are clearly documented."

## MVP Scope

Litoho MVP should confidently support:

- `npx litoho new <app>`
- `litoho dev`, `litoho build`, and `litoho start`
- file-based pages in `app/pages`
- file-based APIs in `app/api`
- SSR pages and `"use client"` browser pages
- layouts, `_not-found.ts`, and `_error.ts`
- route manifest generation
- middleware conventions and helpers
- `public/` assets such as `logo.png`, `robots.txt`, and `sitemap.xml`
- reactive state from `@litoho/core`
- base UI flow from `@litoho/ui`

Anything beyond that can ship after MVP.

## Release Blockers

- `pnpm build` passes from a clean checkout
- `pnpm typecheck` passes
- `pnpm test` passes
- `pnpm run release:preflight` passes
- fresh scaffold works from the published CLI
- generated app works through `dev`, `build`, and `start`
- `public/` assets are reachable in production mode
- docs match the package version being published
- examples still boot on the current version

## Fresh Install Smoke Test

Run this outside the monorepo, or in a temporary directory:

```bash
npx litoho new demo-app
cd demo-app
npm install
npm run dev
npm run build
npm start
```

Confirm:

- `/` renders
- one nested page renders
- one API route responds
- one dynamic route responds
- `public/logo.png` or another public asset loads

## Docs Gate

Before publish, confirm the docs explain:

- what Litoho is
- who it is for
- core routing conventions
- `"use client"` and `"use server"` behavior
- middleware and API patterns
- `public/` asset behavior
- release and publish workflow

Recommended docs to review:

- `README.md`
- `docs/CLI.md`
- `docs/COMPONENTS.md`
- `docs/state.md`
- `docs/PUBLISHING.md`

## Pre-Release Checklist

Use this exact sequence before running `release:publish`:

1. Commit or stash all unfinished work.
2. Run `pnpm install` if dependencies changed.
3. Run `pnpm build`.
4. Run `pnpm typecheck`.
5. Run `pnpm test`.
6. Run `pnpm run release:preflight`.
7. Run a dry run with `pnpm run release:pack`.
8. Verify package names, versions, and CLI identity.
9. Verify the scaffolded app version matches the version about to be published.
10. Publish with `pnpm run release:publish`.

## Nice To Have, Not MVP Blockers

- more UI components
- Bun adapter or additional server adapters
- richer deployment adapters
- docs search
- plugin ecosystem
- advanced auth/database integrations

## MVP Decision

Litoho is ready for MVP when:

- a new user can scaffold an app without repo context
- the app can render SSR pages, run APIs, and serve `public/` assets
- the docs explain the conventions clearly enough to build a small app
- the release flow is repeatable without manual patching
