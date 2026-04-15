import { LitElement, css, html } from "lit";
import { luiBaseStyles } from "./styles.js";

export class LuiCard extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
      }

      article {
        display: grid;
        gap: 1.15rem;
        padding: 1.35rem;
        border-radius: 1.35rem;
        border: 1px solid var(--lui-border);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 34%),
          var(--lui-panel);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.34);
      }
    `
  ];

  render() {
    return html`<article part="card"><slot></slot></article>`;
  }
}

export class LuiCardHeader extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: grid;
        gap: 0.45rem;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiCardTitle extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
        font-size: clamp(1.25rem, 2vw, 1.6rem);
        font-weight: 700;
        line-height: 1.08;
        letter-spacing: -0.04em;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiCardDescription extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
        color: var(--lui-muted);
        line-height: 1.7;
        font-size: 0.95rem;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiCardContent extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: grid;
        gap: 1rem;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiCardFooter extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}
