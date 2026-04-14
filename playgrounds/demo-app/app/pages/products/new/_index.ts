import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Create Products"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Create Products</h1>
      <p>This page represents the create flow for products.</p>
    </main>
  `
};

export default page;
