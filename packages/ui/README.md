# @litoho/ui

Small, framework-native Lit UI primitives for Litoho.

The package aims for a shadcn-style developer experience:

- import one package
- get ready-to-use components
- style through attributes, slots, and CSS parts
- keep the surface area small and composable

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
