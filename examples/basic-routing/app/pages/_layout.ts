import { html } from "lit";
import type { LitoLayoutModule } from "@litoho/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Litoho Basic Routing"
  }),
  render: ({ children }) => html`
    <div style="min-height: 100vh; background: radial-gradient(circle at top, #1c2f52 0%, #07101f 38%, #020611 100%); color: #f6f3ea;">
      ${children}
    </div>
  `
};

export default layout;
