import { LitElement, css, html } from "lit";
import { defineElement } from "./define-element.js";
import { luiBaseStyles } from "./styles.js";

export class LuiDropdownMenu extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        position: relative;
        display: inline-flex;
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
    document.addEventListener("click", this.handleDocumentClick);
    document.addEventListener("keydown", this.handleKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick);
    document.removeEventListener("keydown", this.handleKeydown);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("open")) {
      this.dispatchEvent(new CustomEvent("lui-dropdown-change", { bubbles: false, composed: false }));
    }
  }

  openMenu() {
    this.open = true;
  }

  closeMenu() {
    this.open = false;
  }

  toggleMenu() {
    this.open = !this.open;
  }

  render() {
    return html`<slot></slot>`;
  }

  private readonly handleDocumentClick = (event: MouseEvent) => {
    if (!this.open) {
      return;
    }

    const path = event.composedPath();
    if (!path.includes(this)) {
      this.closeMenu();
    }
  };

  private readonly handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.open) {
      this.closeMenu();
    }
  };
}

export class LuiDropdownTrigger extends LitElement {
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
    const dropdown = this.closest("lui-dropdown-menu") as LuiDropdownMenu | null;
    dropdown?.toggleMenu();
  };
}

export class LuiDropdownContent extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        position: absolute;
        top: calc(100% + 0.6rem);
        right: 0;
        z-index: 40;
      }

      .panel {
        min-width: 12rem;
        padding: 0.4rem;
        border-radius: 1rem;
        border: 1px solid var(--lui-border);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 26%),
          var(--lui-panel);
        box-shadow: 0 24px 80px rgba(2, 6, 23, 0.36);
      }
    `
  ];

  private dropdown?: LuiDropdownMenu | null;
  private onDropdownChange = () => this.requestUpdate();

  override connectedCallback(): void {
    super.connectedCallback();
    this.dropdown = this.closest("lui-dropdown-menu") as LuiDropdownMenu | null;
    this.dropdown?.addEventListener("lui-dropdown-change", this.onDropdownChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dropdown?.removeEventListener("lui-dropdown-change", this.onDropdownChange);
  }

  render() {
    if (!this.dropdown?.open) {
      return html``;
    }

    return html`<div class="panel" part="content"><slot></slot></div>`;
  }
}

export class LuiDropdownItem extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
      }

      button {
        width: 100%;
        min-height: 2.35rem;
        padding: 0 0.8rem;
        border: 0;
        border-radius: 0.8rem;
        background: transparent;
        color: var(--lui-foreground);
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease;
      }

      button:hover {
        background: rgba(148, 163, 184, 0.14);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  ];

  declare disabled: boolean;

  constructor() {
    super();
    this.disabled = false;
  }

  render() {
    return html`<button type="button" ?disabled=${this.disabled} part="item" @click=${this.handleSelect}><slot></slot></button>`;
  }

  private readonly handleSelect = () => {
    if (this.disabled) {
      return;
    }

    this.dispatchEvent(new CustomEvent("lui-select", { bubbles: true, composed: true }));
    const dropdown = this.closest("lui-dropdown-menu") as LuiDropdownMenu | null;
    dropdown?.closeMenu();
  };
}

export class LuiDropdownSeparator extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
        height: 1px;
        margin: 0.35rem 0;
        background: var(--lui-border);
      }
    `
  ];

  render() {
    return html``;
  }
}

function registerLuiDropdown() {
  defineElement("lui-dropdown-menu", LuiDropdownMenu);
  defineElement("lui-dropdown-trigger", LuiDropdownTrigger);
  defineElement("lui-dropdown-content", LuiDropdownContent);
  defineElement("lui-dropdown-item", LuiDropdownItem);
  defineElement("lui-dropdown-separator", LuiDropdownSeparator);
}

registerLuiDropdown();
