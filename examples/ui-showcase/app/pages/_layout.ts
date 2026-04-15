import { html } from "lit";
import type { LitoLayoutModule } from "@litoho/app";

const layout: LitoLayoutModule<{ appName: string }> = {
  load: () => ({
    appName: "Litoho UI"
  }),
  render: ({ children, data }) => html`
    <div class="min-h-screen bg-transparent">
      <header class="sticky top-0 z-10 border-b border-white/10 bg-slate-950/65 backdrop-blur">
        <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <a href="/" class="text-sm font-semibold uppercase tracking-[0.28em] text-white">${data.appName}</a>
          <nav class="flex items-center gap-4 text-sm text-slate-300">
            <a class="transition hover:text-white" href="/">Home</a>
            <a class="transition hover:text-white" href="/api/health">API</a>
          </nav>
        </div>
      </header>
      ${children}
    </div>
  `
};

export default layout;
