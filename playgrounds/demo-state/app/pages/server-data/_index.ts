"use server";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

type CatalogPayload = {
  ok: boolean;
  total: number;
  items: Array<{
    id: string;
    title: string;
    kind: string;
    featured: boolean;
    tags: string[];
  }>;
};

const page: LitoPageModule<CatalogPayload> = {
  document: {
    title: "Server Data | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  load: async ({ url }) => {
    const response = await fetch(new URL("/api/catalog?limit=3&featured=true&tag=reactive", url.origin));
    return response.json();
  },
  render: ({ data }) => html`
    <main style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
      <section style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16); color: #e5eefb;">
        <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">SSR data page</div>
        <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Loaded from a typed Lito API route</h2>
        <p style="margin: 0; color: #b9c7da; line-height: 1.7;">
          This page stays SSR and calls <code>/api/catalog</code> during <code>load()</code>.
        </p>
        <div style="display: grid; gap: 12px; margin-top: 24px;">
          ${data.items.map(
            (item) => html`
              <article style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
                <div style="font-size: 0.82rem; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.12em;">${item.kind}</div>
                <h3 style="margin: 8px 0 6px;">${item.title}</h3>
                <div style="color: #94a3b8;">Tags: ${item.tags.join(", ")}</div>
              </article>
            `
          )}
        </div>
      </section>
    </main>
  `
};

export default page;
