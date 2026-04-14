import { LitElement } from "lit";
import { ReactiveMixin } from "./reactive-mixin.js";

/**
 * Base element for all Lito components.
 *
 * Extends `LitElement` with `ReactiveMixin` so that any signal read during
 * `render()` automatically triggers a re-render when it changes.
 *
 * ```ts
 * import { LitoElement } from '@lito/core';
 * import { signal } from '@lito/core';
 * import { html } from 'lit';
 * import { customElement } from 'lit/decorators.js';
 *
 * const name = signal('World');
 *
 * @customElement('my-greeting')
 * class MyGreeting extends LitoElement {
 *   render() {
 *     return html`<p>Hello, ${name.get()}!</p>`;
 *   }
 * }
 * ```
 */
export class LitoElement extends ReactiveMixin(LitElement) {
  protected get frameworkName(): string {
    return "Lito";
  }
}
