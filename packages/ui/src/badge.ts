import { LitElement, css, html } from "lit";
import { defineElement } from "./define-element.js";
import { luiBaseStyles } from "./styles.js";

export type LuiBadgeVariant = "default" | "outline" | "soft";

export class LuiBadge extends LitElement {
  static properties = {
    variant: { type: String, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: inline-flex;
      }

      span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 1.7rem;
        padding: 0 0.72rem;
        border-radius: 999px;
        border: 1px solid transparent;
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      span.default {
        background: color-mix(in oklab, var(--lui-accent) 88%, white);
        color: var(--lui-accent-ink);
      }

      span.outline {
        border-color: var(--lui-border-strong);
        color: var(--lui-foreground);
        background: transparent;
      }

      span.soft {
        background: rgba(250, 204, 21, 0.12);
        color: color-mix(in oklab, var(--lui-accent) 72%, white);
      }
    `
  ];

  declare variant: LuiBadgeVariant;

  constructor() {
    super();
    this.variant = "default";
  }

  render() {
    return html`<span class=${this.variant} part="badge"><slot></slot></span>`;
  }
}

function registerLuiBadge() {
  defineElement("lui-badge", LuiBadge);
}

registerLuiBadge();
