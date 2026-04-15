import { css } from "lit";

export const luiBaseStyles = css`
  :host {
    --lui-font-sans: "Inter", "Segoe UI", sans-serif;
    --lui-bg: #08101d;
    --lui-panel: rgba(15, 23, 42, 0.84);
    --lui-panel-soft: rgba(15, 23, 42, 0.56);
    --lui-border: rgba(148, 163, 184, 0.2);
    --lui-border-strong: rgba(226, 232, 240, 0.34);
    --lui-foreground: #f8fafc;
    --lui-muted: #94a3b8;
    --lui-accent: #facc15;
    --lui-accent-ink: #111827;
    --lui-danger: #ef4444;
    color: var(--lui-foreground);
    font-family: var(--lui-font-sans);
    box-sizing: border-box;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
`;
