# @litoho/ui

Small, framework-native Lit UI primitives for Litoho.

The package aims for a shadcn-style developer experience:

- import one package
- get ready-to-use components
- style through attributes, slots, and CSS parts
- keep the surface area small and composable

It now supports selective imports as well, so you do not have to load the whole set when you only need one primitive.

## Included components

- `<lui-button>`
- `<lui-badge>`
- `<lui-card>`
- `<lui-card-header>`
- `<lui-card-title>`
- `<lui-card-description>`
- `<lui-card-content>`
- `<lui-card-footer>`
- `<lui-input>`
- `<lui-textarea>`
- `<lui-dialog>`
- `<lui-dropdown-menu>`
- `<lui-tabs>`
- `<lui-toast-region>`
- `<lui-select>`

## Example

```ts
import "@litoho/ui";
import { html } from "lit";

export const page = html`
  <lui-card>
    <lui-card-header>
      <lui-badge variant="outline">New</lui-badge>
      <lui-card-title>Litoho UI</lui-card-title>
      <lui-card-description>Lit components with a calm, modern default theme.</lui-card-description>
    </lui-card-header>

    <lui-card-content>
      <lui-input placeholder="Project name"></lui-input>
    </lui-card-content>

    <lui-card-footer>
      <lui-button>Continue</lui-button>
      <lui-button variant="ghost">Cancel</lui-button>
    </lui-card-footer>
  </lui-card>
`;
```

## Selective Imports

Import only the component module you need:

```ts
import "@litoho/ui/badge";
import { html } from "lit";

export default {
  render: () => html`<lui-badge variant="outline">Minimal</lui-badge>`
};
```

Useful subpaths:

- `@litoho/ui/badge`
- `@litoho/ui/button`
- `@litoho/ui/card`
- `@litoho/ui/dialog`
- `@litoho/ui/dropdown`
- `@litoho/ui/input`
- `@litoho/ui/select`
- `@litoho/ui/tabs`
- `@litoho/ui/toast`

## CLI Add Flow

If you are inside a Litoho app, you can register components from the CLI:

```bash
pnpm exec litoho ui list
pnpm exec litoho ui diff
pnpm exec litoho ui info dialog
pnpm exec litoho ui info form
pnpm exec litoho ui add badge
pnpm exec litoho ui add form
pnpm exec litoho ui add overlay --copy
pnpm exec litoho ui upgrade
pnpm exec litoho ui upgrade overlay --force
pnpm exec litoho ui add badge button card
```

By default this adds package imports like `@litoho/ui/badge` into your app layout or page entry.

If you want a shadcn-style local copy instead of package imports:

```bash
pnpm exec litoho ui add dialog tabs --copy
```

That copies component source files into `app/components/ui` and imports them from there.

To inspect or sync local copied components:

```bash
pnpm exec litoho ui diff
pnpm exec litoho ui upgrade
pnpm exec litoho ui upgrade overlay --force
```

`ui upgrade` is safe by default and skips files that differ from upstream unless you pass `--force`.

Current presets:

- `form`: `input`, `textarea`, `select`, `button`
- `overlay`: `dialog`, `dropdown`, `toast`, `button`
- `content`: `card`, `badge`, `button`
- `navigation`: `tabs`, `dropdown`, `button`
