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
