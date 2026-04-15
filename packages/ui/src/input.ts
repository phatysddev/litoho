import { LitElement, css, html } from "lit";
import { createRef, ref } from "lit/directives/ref.js";
import { defineElement } from "./define-element.js";
import { luiBaseStyles } from "./styles.js";

export class LuiInput extends LitElement {
  static properties = {
    type: { type: String, reflect: true },
    name: { type: String },
    value: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    autocomplete: { type: String }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
      }

      input {
        width: 100%;
        min-height: 2.9rem;
        padding: 0 0.95rem;
        border-radius: 0.95rem;
        border: 1px solid var(--lui-border);
        background: var(--lui-panel-soft);
        color: var(--lui-foreground);
        font: inherit;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          background-color 160ms ease;
      }

      input::placeholder {
        color: color-mix(in oklab, var(--lui-muted) 80%, transparent);
      }

      input:focus {
        outline: none;
        border-color: color-mix(in oklab, var(--lui-accent) 58%, white);
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.16);
      }

      input:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    `
  ];

  declare type: string;
  declare name: string;
  declare value: string;
  declare placeholder: string;
  declare disabled: boolean;
  declare readonly: boolean;
  declare autocomplete: string;

  private readonly inputRef = createRef<HTMLInputElement>();

  constructor() {
    super();
    this.type = "text";
    this.name = "";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.readonly = false;
    this.autocomplete = "off";
  }

  focus() {
    this.inputRef.value?.focus();
  }

  render() {
    return html`
      <input
        ${ref(this.inputRef)}
        part="input"
        .type=${this.type}
        .name=${this.name}
        .value=${this.value}
        .placeholder=${this.placeholder}
        .disabled=${this.disabled}
        .readOnly=${this.readonly}
        .autocomplete=${this.autocomplete}
        @input=${this.handleInput}
        @change=${this.forwardChange}
      />
    `;
  }

  private handleInput(event: Event) {
    const nextValue = (event.target as HTMLInputElement).value;
    this.value = nextValue;
    this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  }

  private forwardChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
}

export class LuiTextarea extends LitElement {
  static properties = {
    name: { type: String },
    value: { type: String },
    placeholder: { type: String },
    disabled: { type: Boolean, reflect: true },
    readonly: { type: Boolean, reflect: true },
    rows: { type: Number }
  };

  static styles = [
    luiBaseStyles,
    css`
      :host {
        display: block;
      }

      textarea {
        width: 100%;
        min-height: 8rem;
        padding: 0.85rem 0.95rem;
        border-radius: 1rem;
        border: 1px solid var(--lui-border);
        background: var(--lui-panel-soft);
        color: var(--lui-foreground);
        font: inherit;
        resize: vertical;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease,
          background-color 160ms ease;
      }

      textarea::placeholder {
        color: color-mix(in oklab, var(--lui-muted) 80%, transparent);
      }

      textarea:focus {
        outline: none;
        border-color: color-mix(in oklab, var(--lui-accent) 58%, white);
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.16);
      }

      textarea:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
    `
  ];

  declare name: string;
  declare value: string;
  declare placeholder: string;
  declare disabled: boolean;
  declare readonly: boolean;
  declare rows: number;

  constructor() {
    super();
    this.name = "";
    this.value = "";
    this.placeholder = "";
    this.disabled = false;
    this.readonly = false;
    this.rows = 4;
  }

  render() {
    return html`
      <textarea
        part="textarea"
        .name=${this.name}
        .value=${this.value}
        .placeholder=${this.placeholder}
        .disabled=${this.disabled}
        .readOnly=${this.readonly}
        .rows=${this.rows}
        @input=${this.handleInput}
        @change=${this.forwardChange}
      ></textarea>
    `;
  }

  private handleInput(event: Event) {
    const nextValue = (event.target as HTMLTextAreaElement).value;
    this.value = nextValue;
    this.dispatchEvent(new InputEvent("input", { bubbles: true, composed: true }));
  }

  private forwardChange() {
    this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }
}

function registerLuiInput() {
  defineElement("lui-input", LuiInput);
  defineElement("lui-textarea", LuiTextarea);
}

registerLuiInput();
