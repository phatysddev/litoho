"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const page: LitoPageModule = {
  document: {
    title: "New Page"
  },
  load: async ({ url }) => {
    // Determine absolute URL (works on both client and SSR server)
    const apiUrl = new URL("/api/health", url.origin).href;
    const res = await fetch(apiUrl);
    return res.json();
  },
  render: ({ data }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>CSR Page Fetching API</h1>
      <pre>API returned: ${JSON.stringify(data, null, 2)}</pre>
      <p>Edit /Users/yodsaveesupachoktanasap/Desktop/lito/playgrounds/demo-hydration/app/pages/csr-page/_index.ts to continue.</p>
    </main>
  `
};

export default page;
