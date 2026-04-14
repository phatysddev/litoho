import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Edit Products"
  },
  render: ({ params }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Edit Products</h1>
      <p>Updating products with id <strong>${params.id}</strong>.</p>
    </main>
  `
};

export default page;
