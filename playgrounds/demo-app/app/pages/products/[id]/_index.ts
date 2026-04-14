import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Products Detail"
  },
  render: ({ params }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Products Detail</h1>
      <p>Viewing products with id <strong>${params.id}</strong>.</p>
      <p><a href="/products/${params.id}/edit">Edit this products</a></p>
    </main>
  `
};

export default page;
