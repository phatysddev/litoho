"use server";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { get as getHealth } from "../../api/health.js";

export type ActionData = {
  success: boolean;
  message: string;
};

const page: LitoPageModule<unknown, ActionData> = {
  cache: {
    maxAge: 10,
    staleWhileRevalidate: 30
  },
  document: {
    title: "New Page"
  },
  load: async () => {
    // SSR Direct Function Call (No Network Fetch!)
    const res = await getHealth();
    return res.json();
  },
  action: async ({ request }) => {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    
    return {
      success: true,
      message: `Form Action Successfully Captured Name: ${name || 'Anonymous'}`
    };
  },
  render: ({ data, actionData }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 32px;">
      <h1>SSR Page with Form Actions</h1>
      <pre>API returned: ${JSON.stringify(data, null, 2)}</pre>

      <section style="margin-top: 32px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2>Form Submission Test</h2>
        ${actionData?.success 
          ? html`<div style="color: #15803d; margin-bottom: 16px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
              ${actionData.message}
            </div>` 
          : html``}
          
        <form method="POST">
          <label style="display: block; margin-bottom: 8px;">Name</label>
          <input type="text" name="name" placeholder="Enter your name" style="padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; max-width: 300px;" />
          <button type="submit" style="margin-top: 16px; padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Submit Server Action
          </button>
        </form>
      </section>
    </main>
  `
};

export default page;
