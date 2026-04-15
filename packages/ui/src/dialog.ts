import { LitElement, css, html } from "lit";
import { defineElement } from "./define-element.js";
import { luiBaseStyles } from "./styles.js";

export class LuiDialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: contents;
      }
    `
  ];

  declare open: boolean;

  constructor() {
    super();
    this.open = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("keydown", this.handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.handleKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("open")) {
      this.dispatchEvent(new CustomEvent("lui-dialog-change", { bubbles: false, composed: false }));
    }
  }

  openDialog() {
    this.open = true;
  }

  closeDialog() {
    this.open = false;
  }

  toggleDialog() {
    this.open = !this.open;
  }

  render() {
    return html`<slot></slot>`;
  }

  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.open) {
      this.closeDialog();
    }
  };
}

export class LuiDialogTrigger extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: inline-flex;
      }

      button {
        all: unset;
        display: inline-flex;
        cursor: pointer;
      }
    `
  ];

  render() {
    return html`<button type="button" part="trigger" @click=${this.handleClick}><slot></slot></button>`;
  }

  private readonly handleClick = () => {
    const dialog = this.closest("lui-dialog") as LuiDialog | null;
    dialog?.openDialog();
  };
}

export class LuiDialogClose extends LitElement {
  static styles = LuiDialogTrigger.styles;

  render() {
    return html`<button type="button" part="close" @click=${this.handleClick}><slot></slot></button>`;
  }

  private readonly handleClick = () => {
    const dialog = this.closest("lui-dialog") as LuiDialog | null;
    dialog?.closeDialog();
  };
}

export class LuiDialogContent extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: contents;
      }

      .overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
        background: rgba(2, 6, 23, 0.72);
        backdrop-filter: blur(10px);
      }

      .panel {
        position: fixed;
        inset: 50% auto auto 50%;
        z-index: 50;
        width: min(32rem, calc(100vw - 2rem));
        transform: translate(-50%, -50%);
        display: grid;
        gap: 1rem;
        padding: 1.35rem;
        border-radius: 1.25rem;
        border: 1px solid var(--lui-border);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 26%),
          var(--lui-panel);
        box-shadow: 0 30px 100px rgba(2, 6, 23, 0.42);
      }
    `
  ];

  private dialog?: LuiDialog | null;
  private onDialogChange = () => this.requestUpdate();

  override connectedCallback(): void {
    super.connectedCallback();
    this.dialog = this.closest("lui-dialog") as LuiDialog | null;
    this.dialog?.addEventListener("lui-dialog-change", this.onDialogChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dialog?.removeEventListener("lui-dialog-change", this.onDialogChange);
  }

  render() {
    if (!this.dialog?.open) {
      return html``;
    }

    return html`
      <div class="overlay" part="overlay" @click=${this.close}></div>
      <section class="panel" part="content" role="dialog" aria-modal="true">
        <slot></slot>
      </section>
    `;
  }

  private readonly close = () => {
    this.dialog?.closeDialog();
  };
}

export class LuiDialogTitle extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
        font-size: 1.45rem;
        font-weight: 700;
        letter-spacing: -0.04em;
        line-height: 1.1;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiDialogDescription extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
        color: var(--lui-muted);
        line-height: 1.7;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiDialogFooter extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.75rem;
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

function registerLuiDialog() {
  defineElement("lui-dialog", LuiDialog);
  defineElement("lui-dialog-trigger", LuiDialogTrigger);
  defineElement("lui-dialog-close", LuiDialogClose);
  defineElement("lui-dialog-content", LuiDialogContent);
  defineElement("lui-dialog-title", LuiDialogTitle);
  defineElement("lui-dialog-description", LuiDialogDescription);
  defineElement("lui-dialog-footer", LuiDialogFooter);
}

registerLuiDialog();
