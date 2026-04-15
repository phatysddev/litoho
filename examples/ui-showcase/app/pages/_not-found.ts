import { html } from "lit";
import type { LitoNotFoundModule } from "@litoho/app";

const page: LitoNotFoundModule = {
  document: {
    title: "Page Not Found"
  },
  render: ({ pathname }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>404</h1>
      <p>No route matched <code>${pathname}</code>.</p>
      <p><a href="/">Back to home</a></p>
    </main>
  `
};

export default page;
