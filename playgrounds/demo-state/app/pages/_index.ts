import { html } from "lit";
import type { LitoPageModule } from "@lito/app";

const cards = [
  {
    href: "/counter",
    title: "Counter",
    subtitle: "signal + memo + watch",
    body: "Client-only state page rendered through Lito's browser runtime."
  },
  {
    href: "/store",
    title: "Store",
    subtitle: "store + batch + delegated events",
    body: "Object-shaped app state with updates routed through @lito/core."
  },
  {
    href: "/todos",
    title: "Todos",
    subtitle: "interactive mini app",
    body: "A larger client-only page that keeps all interaction inside the framework primitives."
  },
  {
    href: "/server-data",
    title: "Server Data",
    subtitle: "SSR + API route",
    body: "Loads typed API data on the server to show the full-stack path end to end."
  }
];

const page: LitoPageModule = {
  document: {
    title: "Lito Demo State",
    styles: [`
      * { box-sizing: border-box; }
      body { margin: 0; font-family: "IBM Plex Sans", system-ui, sans-serif; }
      a:hover { border-color: rgba(245, 158, 11, 0.6) !important; transform: translateY(-1px); }
    `]
  },
  render: ({ layoutData }) => html`
    <main style="max-width: 1120px; margin: 0 auto; padding: 40px 24px 80px;">
      <section style="display: grid; gap: 18px; grid-template-columns: 1.3fr 0.9fr; align-items: start;">
        <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.18);">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 999px; background: rgba(14, 165, 233, 0.14); color: #7dd3fc; font-size: 0.82rem;">
            @lito/app + @lito/core + @lito/server
          </div>
          <h2 style="margin: 16px 0 10px; font-size: 3rem; line-height: 1.02;">State demo rebuilt as a real Lito app</h2>
          <p style="margin: 0; max-width: 760px; color: #b9c7da; font-size: 1.05rem; line-height: 1.7;">
            This playground uses Lito layout loading, file-based pages, typed API routes, client boot,
            and CSR-only interactive screens. The overview page stays SSR, while the state-heavy pages opt
            into <code>"use client"</code> so browser state and events live entirely on the client.
          </p>
        </div>
        <div style="padding: 24px; border-radius: 24px; background: linear-gradient(180deg, rgba(245, 158, 11, 0.14), rgba(14, 165, 233, 0.08)); border: 1px solid rgba(148, 163, 184, 0.16);">
          <div style="font-size: 0.82rem; letter-spacing: 0.16em; text-transform: uppercase; color: #fcd34d;">Layout Data</div>
          <div style="margin-top: 12px; color: #dbe7f5; line-height: 1.8;">
            <div>App: ${String((layoutData.root as { appName?: string })?.appName ?? "Lito Demo State")}</div>
            <div>Sections: ${String((layoutData.root as { sections?: unknown[] })?.sections?.length ?? 0)}</div>
            <div>Mode mix: SSR shell + CSR pages + API route</div>
          </div>
        </div>
      </section>

      <section style="display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 24px;">
        ${cards.map(
          (card) => html`
            <a
              href=${card.href}
              style="display: block; text-decoration: none; color: inherit; padding: 22px; border-radius: 22px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16); transition: transform 0.18s ease, border-color 0.18s ease;"
            >
              <div style="font-size: 0.84rem; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.12em;">${card.subtitle}</div>
              <h3 style="margin: 10px 0 8px; font-size: 1.45rem;">${card.title}</h3>
              <p style="margin: 0; color: #b9c7da; line-height: 1.65;">${card.body}</p>
            </a>
          `
        )}
      </section>
    </main>
  `
};

export default page;
