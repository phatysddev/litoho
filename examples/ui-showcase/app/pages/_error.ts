import { html } from "lit";
import type { LitoErrorModule } from "@litoho/app";

const page: LitoErrorModule = {
  document: ({ status }) => ({
    title: `Server Error ${status}`
  }),
  render: ({ status, error }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>${status}</h1>
      <p>Litoho caught a page render failure.</p>
      <pre style="padding: 16px; border-radius: 16px; background: #0f172a; color: #e2e8f0; overflow: auto;">${String(error)}</pre>
      <p><a href="/">Back to home</a></p>
    </main>
  `
};

export default page;
