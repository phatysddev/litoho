# Publishing Litoho

This guide prepares the monorepo for npm publishing and shows the commands to release either the default package set or a scoped variant.

## What Gets Published

The release script publishes these packages in order:

- `@scope/router`
- `@scope/core`
- `@scope/server`
- `@scope/app`
- `cli package`

By default that means:

- `@litoho/router`
- `@litoho/core`
- `@litoho/server`
- `@litoho/app`
- `litoho`

The final CLI package name is controlled separately because some npm package names may be unavailable.

## Environment Variables

- `LITOHO_SCOPE`
  Scope used for framework packages.
  Default: `@litoho`
- `LITOHO_CLI_PACKAGE`
  Package name for the CLI.
  Default: `litoho`
- `LITOHO_CLI_BIN`
  Command name installed in the package bin.
  Default: `litoho`

## Preflight

Before publishing, run:

```bash
pnpm run release:preflight
```

This checks:

- resolved publish names
- current versions
- required `dist/` files
- CLI bin wiring

You can also preview identity rewriting:

```bash
pnpm run identity:preview
```

## Pre-Release Checklist

Run this sequence before the final publish:

1. Make sure the git worktree is clean.
2. Run `pnpm build`.
3. Run `pnpm typecheck`.
4. Run `pnpm test`.
5. Run `pnpm run release:preflight`.
6. Run `pnpm run release:pack`.
7. Smoke test a fresh scaffolded app from the current CLI version.
8. Confirm `public/` assets such as `logo.png`, `robots.txt`, and `sitemap.xml` are reachable in the generated app.

If you want a single human-readable gate for MVP, use [docs/MVP.md](/Users/yodsaveesupachoktanasap/Desktop/lito/docs/MVP.md).

You can also run the scaffold smoke test directly:

```bash
pnpm run release:smoke:new
```

If you want one command that runs preflight, scaffold smoke test, and the full test suite:

```bash
pnpm run release:verify
```

If you want the same flow against the published package:

```bash
pnpm run release:verify:published
```

All release scripts also write a machine-readable `release-report.json` in the repo root by default. You can override the output path with:

```bash
LITOHO_RELEASE_REPORT=artifacts/release-report.json pnpm run release:verify
```

Top-level report status is summarized automatically:

- `passed`
- `warning`
- `failed`

You can validate the report in CI or locally with:

```bash
pnpm run release:report:check
pnpm run release:report:check -- --report artifacts/release-report.json
```

And you can render a markdown summary from the same report with:

```bash
pnpm run release:report:summary
pnpm run release:report:summary -- --report artifacts/release-report.json --out artifacts/summary.md
```

For a fuller end-to-end check after publish:

```bash
pnpm run release:smoke:new -- --published --install --build --start
```

You can also target a custom published scope or CLI package explicitly:

```bash
pnpm run release:smoke:new -- --published --scope @litoho --cli-package litoho --install --build --start
pnpm run release:smoke:new -- --published --scope @your-scope --cli-package @your-scope/litoho --install --build --start
```

And the same published mode works through the verify command:

```bash
pnpm run release:verify -- --published --scope @your-scope --cli-package @your-scope/litoho --install --build --start
```

`release:publish` now runs `release:verify` automatically before publishing. If you intentionally want to bypass that gate for a one-off release, use:

```bash
pnpm run release:publish -- --skip-verify
```

Or:

```bash
LITOHO_SKIP_VERIFY=true pnpm run release:publish
```

If you also want a post-publish verification pass against the published package:

```bash
pnpm run release:publish -- --verify-published
```

## GitHub Actions Example

An example workflow is included at `.github/workflows/release-report-check.yml`.

It does four things:

1. installs dependencies
2. runs `pnpm run release:verify -- --report artifacts/release-report.json`
3. runs `pnpm run release:report:check -- --report artifacts/release-report.json`
4. uploads the report as a workflow artifact

If any step in `release-report.json` ends in `failed`, the job exits non-zero automatically. By default, `warning` also fails the job. If you want warnings to pass, use:

```bash
pnpm run release:report:check -- --allow-warnings
```

That workflow also writes a human-readable job summary into the GitHub Actions summary panel using `pnpm run release:report:summary`.

## Publish Workflow Example

A second example workflow is included at `.github/workflows/publish-release.yml`.

It is designed for manual release publishing through `workflow_dispatch` and supports:

- custom npm scope
- custom CLI package name
- custom CLI bin name
- patch/minor/major bump selection
- optional `--verify-published` pass after publish

To use it in a real repository, add:

- `NPM_TOKEN` as a GitHub Actions secret

The workflow writes and uploads `artifacts/release-report.json`, and also posts a readable markdown summary to the Actions job summary.

## Dry Run

Use a dry run first:

```bash
LITOHO_SCOPE=@your-scope \
LITOHO_CLI_PACKAGE=@your-scope/litoho \
LITOHO_CLI_BIN=litoho \
pnpm run release:pack
```

This creates a temporary release workspace, rewrites package identity for the release target, builds the packages, and runs `npm publish --dry-run` for each one.

## Publish

When the dry run looks correct:

```bash
LITOHO_SCOPE=@your-scope \
LITOHO_CLI_PACKAGE=@your-scope/litoho \
LITOHO_CLI_BIN=litoho \
pnpm run release:publish
```

`release:publish` now auto-bumps the monorepo version before publishing.

- default bump: `patch`
- optional env override: `LITOHO_BUMP=minor` or `LITOHO_BUMP=major`
- optional CLI override: `pnpm run release:publish -- --bump minor`
- after a successful publish, Litoho also updates `CHANGELOG.md`, creates a release commit, and creates an annotated git tag by default

Convenience scripts:

```bash
pnpm run release:publish
pnpm run release:publish:minor
pnpm run release:publish:major
pnpm run release:publish:no-git
```

If you need to skip the auto-bump for a one-off release:

```bash
LITOHO_AUTO_BUMP=false pnpm run release:publish
```

If you need to skip the git commit and tag automation:

```bash
LITOHO_AUTO_GIT=false pnpm run release:publish
```

If your worktree is dirty, publish now stops before doing anything. You can override that guard, but it is not recommended:

```bash
LITOHO_ALLOW_DIRTY=true pnpm run release:publish
```

## Unscoped CLI vs Scoped CLI

If npm allows the unscoped package name:

```bash
LITOHO_SCOPE=@your-scope \
LITOHO_CLI_PACKAGE=litoho \
LITOHO_CLI_BIN=litoho \
pnpm run release:publish
```

That enables:

```bash
npx litoho new demo-app
```

If npm rejects the unscoped CLI package name, publish a scoped CLI instead:

```bash
LITOHO_SCOPE=@your-scope \
LITOHO_CLI_PACKAGE=@your-scope/litoho \
LITOHO_CLI_BIN=litoho \
pnpm run release:publish
```

That is typically invoked as:

```bash
npx @your-scope/litoho new demo-app
```

## Notes

- The release flow builds from a temporary workspace rather than mutating the repo in place.
- Package identity rewriting is applied only inside that temporary release workspace.
- `packages/testing` is not published.
