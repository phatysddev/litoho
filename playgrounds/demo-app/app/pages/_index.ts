import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Welcome to Lito"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Welcome to Lito</h1>
      <p>Your app scaffold is ready.</p>
    </main>
  `
};

export default page;
