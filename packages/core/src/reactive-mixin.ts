// ---------------------------------------------------------------------------
// Lito ReactiveMixin — Auto-connect reactive reads to Lit's rendering cycle
// ---------------------------------------------------------------------------

import type { LitElement } from "lit";
import { watch } from "./signals.js";

type Constructor<T = {}> = new (...args: any[]) => T;

/**
 * A mixin that automatically subscribes a Lit component to any reactive reads
 * inside `render()`. When those values change, the
 * component re-renders automatically.
 *
 * **Usage:**
 *
 * ```ts
 * import { ReactiveMixin, signal } from '@lito/core';
 * import { LitElement, html } from 'lit';
 *
 * const count = signal(0);
 *
 * class MyCounter extends ReactiveMixin(LitElement) {
 *   render() {
 *     return html`
 *       <p>Count: ${count.get()}</p>
 *       <button @click=${() => count.set(count.get() + 1)}>+1</button>
 *     `;
 *   }
 * }
 * ```
 *
 * The mixin:
 * - Tracks which reactive values are read during `render()`
 * - Auto-subscribes to those values
 * - Calls `requestUpdate()` when any tracked signal changes
 * - Cleans up subscriptions on `disconnectedCallback()`
 * - Re-subscribes on `connectedCallback()` (in case the element is re-attached)
 */
export function ReactiveMixin<T extends Constructor<LitElement>>(Base: T) {
  class SignalAwareElement extends Base {
    private __reactiveStop?: () => void;

    override connectedCallback(): void {
      super.connectedCallback();

      if (this.__reactiveStop) {
        return;
      }

      this.__reactiveStop = watch(() => {
        // Run the component's actual render function inside a reactive watcher
        // so any accessed signals become dependencies of this element.
        this.render();
        this.requestUpdate();
      }, { target: "client" });
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      this.__reactiveStop?.();
      this.__reactiveStop = undefined;
    }
  }

  return SignalAwareElement as unknown as Constructor<LitElement> & T;
}
