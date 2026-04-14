# Lito State

Lito ships with a small reactive state layer designed to fit Lit and the rest of the framework runtime.

The current public API is:

- `signal(initialValue)` for writable state
- `memo(readFn)` for derived state
- `watch(fn)` or `watch(fn, [deps])` for side effects
- `batch(fn)` for grouped updates
- `store(initialObject)` for object-shaped state
- `isClient` / `onClient()` for browser-only work
- `isServer` / `onServer()` for server-only work
- `ReactiveMixin(Base)` for Lit integration
- `LitoElement` as the default base class for Lito components

## Philosophy

The state system is intentionally small:

- Reads happen through `.get()`
- Writes happen through `.set()` or `.update()`
- Dependencies are tracked automatically during `memo()`, `watch()`, and `LitoElement.render()`
- Multiple writes can be coalesced with `batch()`

This keeps the runtime predictable and easy to debug while still giving us automatic UI updates.

## `signal()`

Use `signal()` for the smallest unit of writable reactive state.

```ts
import { signal } from "@lito/core";

const count = signal(0);

count.get();
count.set(1);
count.update((value) => value + 1);
count.value = 2;
```

Available methods:

- `get()` reads the current value and tracks dependencies when inside reactive work
- `set(nextValue)` replaces the current value
- `update(updater)` derives the next value from the current one
- `subscribe(listener)` observes changes and returns an unsubscribe function
- `.value` is shorthand for reading and writing the current signal value

## `memo()`

Use `memo()` for derived values.

```ts
import { signal, memo } from "@lito/core";

const count = signal(2);
const doubled = memo(() => count.value * 2);

doubled.value; // 4
```

`memo()` is lazy:

- it computes on first read
- it re-computes when one of its dependencies changes
- it can itself be tracked by other `memo()`, `watch()`, or `LitoElement.render()` calls

## `watch()`

Use `watch()` for side effects such as logging, timers, subscriptions, or syncing to browser APIs.

```ts
import { signal, watch } from "@lito/core";

const user = signal("Lito");

const stop = watch(() => {
  console.log("Current user:", user.get());

  return () => {
    console.log("Cleanup before the next run or stop");
  };
});

stop();
```

Notes:

- `watch()` runs immediately once
- it re-runs when tracked dependencies change
- if your callback returns a function, that function is used as cleanup
- multiple synchronous writes are coalesced through microtasks
- if you prefer React-style dependencies, use `watch(fn, [count, doubled])`
- on `"use client"` pages, `watch()` is enough on its own

```ts
import { memo, signal, watch } from "@lito/core";

const count = signal(0);
const doubled = memo(() => count.value * 2);

watch(() => {
  console.log("Only in browser:", count.value, doubled.value);
}, [count, doubled]);
```

## Browser-only helpers

Lito exposes lightweight runtime helpers for code that must stay out of SSR:

```ts
import { isClient, onClient, isServer, onServer } from "@lito/core";

if (isClient) {
  console.log("Running in the browser");
}

onClient(() => {
  console.log("Safe browser-only bootstrap");
});

if (isServer) {
  console.log("Running on the server");
}

onServer(() => {
  console.log("Safe server-only bootstrap");
});
```

## `batch()`

Use `batch()` to group several writes into a single notification wave.

```ts
import { signal, batch } from "@lito/core";

const first = signal("Lito");
const second = signal("Framework");

batch(() => {
  first.set("New");
  second.set("State");
});
```

This is useful when you want subscribers and `watch()` callbacks to observe the final state after a burst of writes.

## `store()`

Use `store()` when your state is naturally object-shaped.

```ts
import { store } from "@lito/core";

const profile = store({
  name: "Lito User",
  theme: "dark" as "dark" | "light",
  notifications: true
});

profile.get();
profile.get("name");
profile.set("theme", "light");
profile.set({ name: "Admin", notifications: false });
```

Available methods:

- `get()` returns a readonly snapshot
- `get("field")` returns a single field
- `set(partial)` applies a partial object update
- `set("field", value)` updates one field
- `subscribe(listener)` watches the whole object
- `subscribe("field", listener)` watches one field

## Lit integration

If you extend `LitoElement`, any `signal()`, `memo()`, or `store().get(...)` call inside `render()` is tracked automatically.

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

If you need the behavior on a custom Lit base class, use `ReactiveMixin(Base)`.

## Client and server page directives

For page-level rendering mode, prefer top-of-file directives:

```ts
"use client";

const page: LitoPageModule = {
  render: () => {
    // client-only page shell
  }
};
```

Use `"use client";` when:

- the server sends a client root placeholder instead of pre-rendered page HTML
- the client runtime loads the page module and mounts it in the browser
- interactive state and event wiring stay on the client side

Use `"use server";` when you want to make the page's server intent explicit:

```ts
"use server";

const page: LitoPageModule = {
  load: async ({ url }) => {
    return fetch(new URL("/api/data", url.origin)).then((response) => response.json());
  },
  render: ({ data }) => {
    // SSR page
  }
};
```

## Choosing the right primitive

- Use `signal()` for simple values and lists
- Use `memo()` for derived state
- Use `watch()` for effects and integration with external systems
- Use `store()` for object-shaped app state
- Use `batch()` when several writes belong to one logical update

## Demo

The live reference app in this repo is `playgrounds/demo-state`.

Useful pages:

- `/counter` shows `signal()`, `memo()`, and `watch()`
- `/store` shows `store()` with object updates
- `/todos` shows a real UI built from `signal()` and `memo()`
