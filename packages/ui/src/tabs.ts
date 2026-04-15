import { LitElement, css, html } from "lit";
import { luiBaseStyles } from "./styles.js";

type LuiTabsChangeEvent = CustomEvent<{ value: string }>;

export class LuiTabs extends LitElement {
  static properties = {
    value: { type: String, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: grid;
        gap: 1rem;
      }
    `
  ];

  declare value: string;

  constructor() {
    super();
    this.value = "";
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("lui-tabs-select", this.handleTabSelect as EventListener);
  }

  override firstUpdated(): void {
    this.ensureValue();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("lui-tabs-select", this.handleTabSelect as EventListener);
  }

  override updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has("value")) {
      this.dispatchEvent(new CustomEvent("lui-tabs-change", { bubbles: false, composed: false }));
    }
  }

  render() {
    return html`<slot @slotchange=${this.ensureValue}></slot>`;
  }

  private readonly handleTabSelect = (event: LuiTabsChangeEvent) => {
    this.value = event.detail.value;
  };

  private readonly ensureValue = () => {
    if (this.value) {
      return;
    }

    const firstTrigger = this.querySelector<LuiTabsTrigger>("lui-tabs-trigger");
    if (firstTrigger?.value) {
      this.value = firstTrigger.value;
    }
  };
}

export class LuiTabsList extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        padding: 0.35rem;
        border-radius: 999px;
        border: 1px solid var(--lui-border);
        background: rgba(15, 23, 42, 0.5);
      }
    `
  ];

  render() {
    return html`<slot></slot>`;
  }
}

export class LuiTabsTrigger extends LitElement {
  static properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: inline-flex;
      }

      button {
        min-height: 2.4rem;
        padding: 0 1rem;
        border-radius: 999px;
        border: 0;
        background: transparent;
        color: var(--lui-muted);
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
      }

      button[selected] {
        background: rgba(248, 250, 252, 0.96);
        color: var(--lui-accent-ink);
      }

      button:hover {
        color: var(--lui-foreground);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `
  ];

  declare value: string;
  declare disabled: boolean;

  private tabs?: LuiTabs | null;
  private onTabsChange = () => this.requestUpdate();

  constructor() {
    super();
    this.value = "";
    this.disabled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabs = this.closest("lui-tabs") as LuiTabs | null;
    this.tabs?.addEventListener("lui-tabs-change", this.onTabsChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.tabs?.removeEventListener("lui-tabs-change", this.onTabsChange);
  }

  render() {
    const selected = this.tabs?.value === this.value;

    return html`
      <button
        type="button"
        part="trigger"
        ?disabled=${this.disabled}
        ?selected=${selected}
        @click=${this.selectTab}
      >
        <slot></slot>
      </button>
    `;
  }

  private readonly selectTab = () => {
    if (this.disabled || !this.value) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("lui-tabs-select", {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      })
    );
  };
}

export class LuiTabsContent extends LitElement {
  static properties = {
    value: { type: String, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
      }
    `
  ];

  declare value: string;

  private tabs?: LuiTabs | null;
  private onTabsChange = () => this.requestUpdate();

  constructor() {
    super();
    this.value = "";
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabs = this.closest("lui-tabs") as LuiTabs | null;
    this.tabs?.addEventListener("lui-tabs-change", this.onTabsChange);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.tabs?.removeEventListener("lui-tabs-change", this.onTabsChange);
  }

  render() {
    if (this.tabs?.value !== this.value) {
      return html``;
    }

    return html`<slot></slot>`;
  }
}
