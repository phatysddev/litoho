import { LitElement, css, html } from "lit";
import { defineElement } from "./define-element.js";
import { luiBaseStyles } from "./styles.js";

type LuiSelectChoice = {
  value: string;
  label: string;
  disabled: boolean;
};

export class LuiSelect extends LitElement {
  static properties = {
    value: { type: String, reflect: true },
    placeholder: { type: String },
    open: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        position: relative;
        display: block;
      }

      button {
        width: 100%;
        min-height: 2.9rem;
        padding: 0 0.95rem;
        border-radius: 0.95rem;
        border: 1px solid var(--lui-border);
        background: var(--lui-panel-soft);
        color: var(--lui-foreground);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }

      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .panel {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        z-index: 45;
        padding: 0.35rem;
        border-radius: 1rem;
        border: 1px solid var(--lui-border);
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 22%),
          var(--lui-panel);
        box-shadow: 0 20px 70px rgba(2, 6, 23, 0.36);
      }

      .option {
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
      }

      .option:hover {
        background: rgba(148, 163, 184, 0.14);
      }

      .option[selected] {
        background: rgba(250, 204, 21, 0.16);
        color: color-mix(in oklab, var(--lui-accent) 72%, white);
      }
    `
  ];

  declare value: string;
  declare placeholder: string;
  declare open: boolean;
  declare disabled: boolean;

  constructor() {
    super();
    this.value = "";
    this.placeholder = "Select an option";
    this.open = false;
    this.disabled = false;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.handleDocumentClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleDocumentClick);
  }

  render() {
    const choices = this.getChoices();
    const selected = choices.find((choice) => choice.value === this.value);

    return html`
      <button type="button" part="trigger" ?disabled=${this.disabled} @click=${this.toggle}>
        ${selected?.label ?? this.placeholder}
      </button>
      ${this.open
        ? html`
            <div class="panel" part="content">
              ${choices.map(
                (choice) => html`
                  <button
                    class="option"
                    type="button"
                    ?disabled=${choice.disabled}
                    ?selected=${choice.value === this.value}
                    @click=${() => this.selectValue(choice.value)}
                  >
                    ${choice.label}
                  </button>
                `
              )}
            </div>
          `
        : html``}
      <slot hidden></slot>
    `;
  }

  private getChoices(): LuiSelectChoice[] {
    return [...this.querySelectorAll("lui-select-option")].map((option) => ({
      value: option.getAttribute("value") ?? "",
      label: option.textContent?.trim() ?? "",
      disabled: option.hasAttribute("disabled")
    }));
  }

  private readonly toggle = () => {
    if (this.disabled) {
      return;
    }

    this.open = !this.open;
  };

  private readonly selectValue = (value: string) => {
    this.value = value;
    this.open = false;
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  };

  private readonly handleDocumentClick = (event: MouseEvent) => {
    if (!this.open) {
      return;
    }

    const path = event.composedPath();
    if (!path.includes(this)) {
      this.open = false;
    }
  };
}

export class LuiSelectOption extends LitElement {
  static styles = css`
    :host {
      display: none;
    }
  `;

  render() {
    return html`<slot></slot>`;
  }
}

function registerLuiSelect() {
  defineElement("lui-select", LuiSelect);
  defineElement("lui-select-option", LuiSelectOption);
}

registerLuiSelect();
