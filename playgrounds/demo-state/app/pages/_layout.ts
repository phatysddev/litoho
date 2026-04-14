import { html } from "lit";
import type { LitoLayoutModule } from "@lito/app";

const sections = [
  { href: "/", label: "Overview", kind: "SSR shell" },
  { href: "/counter", label: "Counter", kind: "CSR state" },
  { href: "/store", label: "Store", kind: "CSR store" },
  { href: "/todos", label: "Todos", kind: "CSR app" },
  { href: "/server-data", label: "Server Data", kind: "SSR + API" }
];

const layout: LitoLayoutModule<{ appName: string; sections: typeof sections }> = {
  load: () => ({
    appName: "Lito Demo State",
    sections
  }),
  render: ({ children, data }) => html`
    <div style="min-height: 100vh; background:
      radial-gradient(circle at top, rgba(245, 158, 11, 0.18), transparent 26%),
      radial-gradient(circle at left, rgba(14, 165, 233, 0.18), transparent 30%),
      #07111f;
      color: #e5eefb;">
      <header style="border-bottom: 1px solid rgba(148, 163, 184, 0.18); backdrop-filter: blur(12px);">
        <div style="max-width: 1120px; margin: 0 auto; padding: 20px 24px 18px;">
          <div style="display: flex; justify-content: space-between; gap: 18px; align-items: center; flex-wrap: wrap;">
            <div>
              <div style="font-size: 0.8rem; letter-spacing: 0.18em; text-transform: uppercase; color: #f59e0b;">Framework Playground</div>
              <h1 style="margin: 6px 0 0; font-size: 1.5rem;">${data.appName}</h1>
            </div>
            <nav style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${data.sections.map(
                (section) => html`
                  <a
                    href=${section.href}
                    style="padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(148, 163, 184, 0.2); color: #dbe7f5; text-decoration: none; font-size: 0.9rem;"
                  >
                    ${section.label}
                  </a>
                `
              )}
            </nav>
          </div>
        </div>
      </header>
      ${children}
    </div>
  `
};

export default layout;
