import { LitElement, css, html } from "lit";
import { luiBaseStyles } from "./styles.js";

export type LuiToastVariant = "default" | "success" | "danger";

export type LuiToastInput = {
  title: string;
  description?: string;
  variant?: LuiToastVariant;
  duration?: number;
};

type LuiToastRecord = LuiToastInput & {
  id: string;
};

const toasts: LuiToastRecord[] = [];
const listeners = new Set<() => void>();

export function showToast(input: LuiToastInput) {
  const toast: LuiToastRecord = {
    id: crypto.randomUUID(),
    duration: 3200,
    variant: "default",
    ...input
  };

  toasts.push(toast);
  notifyToastListeners();

  const duration = toast.duration ?? 3200;
  if (duration > 0) {
    setTimeout(() => dismissToast(toast.id), duration);
  }

  return toast.id;
}

export function dismissToast(id: string) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index < 0) {
    return;
  }

  toasts.splice(index, 1);
  notifyToastListeners();
}

function subscribeToToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyToastListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export class LuiToastRegion extends LitElement {
  static styles = [
    luiBaseStyles,
    css`
      :host {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        z-index: 70;
        display: grid;
        gap: 0.75rem;
        width: min(24rem, calc(100vw - 2rem));
      }

      article {
        padding: 1rem 1rem 0.95rem;
        border-radius: 1rem;
        border: 1px solid var(--lui-border);
        background: var(--lui-panel);
        box-shadow: 0 18px 60px rgba(2, 6, 23, 0.32);
      }

      article.success {
        border-color: rgba(34, 197, 94, 0.35);
      }

      article.danger {
        border-color: rgba(239, 68, 68, 0.35);
      }

      header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 1rem;
      }

      strong {
        display: block;
        font-size: 0.95rem;
      }

      p {
        margin: 0.35rem 0 0;
        color: var(--lui-muted);
        line-height: 1.6;
        font-size: 0.88rem;
      }

      button {
        all: unset;
        cursor: pointer;
        color: var(--lui-muted);
      }
    `
  ];

  private dispose?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    this.dispose = subscribeToToasts(() => this.requestUpdate());
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.dispose?.();
  }

  render() {
    return html`
      ${toasts.map(
        (toast) => html`
          <article class=${toast.variant ?? "default"} part="toast">
            <header>
              <div>
                <strong>${toast.title}</strong>
                ${toast.description ? html`<p>${toast.description}</p>` : html``}
              </div>
              <button type="button" @click=${() => dismissToast(toast.id)} aria-label="Dismiss toast">×</button>
            </header>
          </article>
        `
      )}
    `;
  }
}
