# @lito/core

Reactive primitives and the base component layer for Lito.

## Public API

```ts
import {
  LitoElement,
  ReactiveMixin,
  signal,
  memo,
  watch,
  batch,
  track,
  store
} from "@lito/core";
```

## Quick example

```ts
import { html } from "lit";
import { LitoElement, signal, memo } from "@lito/core";

const count = signal(0);
const doubled = memo(() => count.get() * 2);

class CounterCard extends LitoElement {
  protected override createRenderRoot() {
    return this;
  }

  override render() {
    return html`
      <p>Count: ${count.get()}</p>
      <p>Doubled: ${doubled.get()}</p>
      <button @click=${() => count.update((value) => value + 1)}>Increment</button>
    `;
  }
}
```

## Docs

- State guide: [../../docs/state.md](../../docs/state.md)
- Working example: `playgrounds/demo-state`
