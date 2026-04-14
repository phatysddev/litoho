import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "Products List"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>Products List</h1>
      <p>Read all products records here.</p>
      <ul>
        <li><a href="/products/new">Create new products</a></li>
        <li><a href="/products/1">Open Products #1</a></li>
      </ul>
    </main>
  `
};

export default page;
