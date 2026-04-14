import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  render: () => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>New Page</h1>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-app/app/pages/users/_index.ts to continue.</p>
    </main>
  `
};

export default page;
