import { LitElement, css, html } from "lit";
import { luiBaseStyles } from "./styles.js";

export type LuiButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
export type LuiButtonSize = "sm" | "md" | "lg";

export class LuiButton extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    href: { type: String },
    type: { type: String },
    disabled: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: inline-flex;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        width: 100%;
        min-width: max-content;
        border-radius: 999px;
        border: 1px solid transparent;
        text-decoration: none;
        font-weight: 600;
        line-height: 1;
        letter-spacing: -0.01em;
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background-color 160ms ease,
          color 160ms ease,
          opacity 160ms ease;
        cursor: pointer;
        white-space: nowrap;
      }

      .button:focus-visible {
        outline: 2px solid color-mix(in oklab, var(--lui-accent) 72%, white);
        outline-offset: 2px;
      }

      .button:hover {
        transform: translateY(-1px);
      }

      .button:active {
        transform: translateY(0);
      }

      .button[disabled],
      .button[aria-disabled="true"] {
        opacity: 0.55;
        cursor: not-allowed;
        pointer-events: none;
      }

      .button.sm {
        min-height: 2.15rem;
        padding: 0 0.95rem;
        font-size: 0.85rem;
      }

      .button.md {
        min-height: 2.7rem;
        padding: 0 1.2rem;
        font-size: 0.94rem;
      }

      .button.lg {
        min-height: 3.15rem;
        padding: 0 1.45rem;
        font-size: 1rem;
      }

      .button.default {
        background: var(--lui-foreground);
        color: var(--lui-accent-ink);
      }

      .button.secondary {
        background: rgba(59, 130, 246, 0.16);
        color: var(--lui-foreground);
      }

      .button.outline {
        border-color: var(--lui-border-strong);
        background: rgba(255, 255, 255, 0.02);
        color: var(--lui-foreground);
      }

      .button.ghost {
        background: transparent;
        color: var(--lui-foreground);
      }

      .button.danger {
        background: color-mix(in oklab, var(--lui-danger) 84%, black);
        color: white;
      }
    `
  ];

  declare variant: LuiButtonVariant;
  declare size: LuiButtonSize;
  declare href?: string;
  declare type: "button" | "submit" | "reset";
  declare disabled: boolean;

  constructor() {
    super();
    this.variant = "default";
    this.size = "md";
    this.href = undefined;
    this.type = "button";
    this.disabled = false;
  }

  render() {
    const className = `button ${this.variant} ${this.size}`;

    if (this.href) {
      return html`
        <a
          class=${className}
          href=${this.href}
          aria-disabled=${String(this.disabled)}
          part="button"
        >
          <slot></slot>
        </a>
      `;
    }

    return html`
      <button
        class=${className}
        type=${this.type}
        ?disabled=${this.disabled}
        part="button"
      >
        <slot></slot>
      </button>
    `;
  }
}
