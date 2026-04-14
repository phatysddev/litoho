import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Lito App"
  }),
  render: ({ children }) => html`
    <div style="min-height: 100vh; background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);">
      ${children}
    </div>
  `
};

export default layout;
