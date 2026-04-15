import "@litoho/ui";
import { html } from "lit";
import type { LitoPageModule } from "@litoho/app";
import { showToast } from "@litoho/ui";

const openToast = (variant: "default" | "success" | "danger", title: string, description: string) => () => {
  showToast({
    variant,
    title,
    description
  });
};

const page: LitoPageModule = {
  document: {
    title: "Litoho UI Showcase"
  },
  render: () => html`
    <main class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 sm:px-8">
      <section class="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end">
        <div>
          <div class="mb-5 inline-flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-lito-gold">
            <span class="h-px w-10 bg-current"></span>
            @litoho/ui
          </div>
          <h1 class="max-w-4xl text-5xl font-semibold uppercase tracking-[-0.08em] text-white sm:text-7xl">
            Lit UI primitives
            <span class="block text-lito-gold">with a shadcn-style feel.</span>
          </h1>
          <p class="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            This page shows every component currently shipped in <code class="rounded bg-white/10 px-2 py-1 text-slate-100">@litoho/ui</code>,
            including the new interactive set: dialog, tabs, dropdown, toast, and select.
          </p>
        </div>

        <lui-card>
          <lui-card-header>
            <lui-badge variant="soft">Preview</lui-badge>
            <lui-card-title>What you get</lui-card-title>
            <lui-card-description>
              Ready-to-use Lit web components with a calm default aesthetic and minimal setup friction.
            </lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <div class="grid gap-3 text-sm text-slate-300">
              <div>Buttons, badges, cards, inputs, textareas</div>
              <div>Dialog, tabs, dropdown-menu, toast, select</div>
              <div>Import once, use anywhere in Litoho pages</div>
            </div>
          </lui-card-content>
        </lui-card>
      </section>

      <section class="grid gap-6 lg:grid-cols-2">
        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Buttons</lui-badge>
            <lui-card-title>Actions</lui-card-title>
            <lui-card-description>Five button variants with compact, medium, and large sizes.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <div class="flex flex-wrap gap-3">
              <lui-button @click=${openToast("default", "Primary action", "Default button clicked.")}>Default</lui-button>
              <lui-button variant="secondary">Secondary</lui-button>
              <lui-button variant="outline">Outline</lui-button>
              <lui-button variant="ghost">Ghost</lui-button>
              <lui-button variant="danger">Danger</lui-button>
            </div>
          </lui-card-content>
        </lui-card>

        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Inputs</lui-badge>
            <lui-card-title>Form primitives</lui-card-title>
            <lui-card-description>Simple inputs that keep the native ergonomics while matching the same visual system.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <div class="grid gap-3">
              <lui-input placeholder="Project name"></lui-input>
              <lui-textarea placeholder="Describe the UI tone you want to build"></lui-textarea>
            </div>
          </lui-card-content>
        </lui-card>

        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Select</lui-badge>
            <lui-card-title>Choice UI</lui-card-title>
            <lui-card-description>A lightweight custom select with hidden option children.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <lui-select placeholder="Choose a theme direction">
              <lui-select-option value="editorial">Editorial Tech</lui-select-option>
              <lui-select-option value="dashboard">Operator Dashboard</lui-select-option>
              <lui-select-option value="studio">Creative Studio</lui-select-option>
            </lui-select>
          </lui-card-content>
        </lui-card>

        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Dropdown</lui-badge>
            <lui-card-title>Compact menus</lui-card-title>
            <lui-card-description>Good for secondary actions and context commands.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <lui-dropdown-menu>
              <lui-dropdown-trigger>
                <span class="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white">
                  Open menu
                </span>
              </lui-dropdown-trigger>
              <lui-dropdown-content>
                <lui-dropdown-item @lui-select=${openToast("success", "Draft saved", "Dropdown item fired a custom event.")}>
                  Save draft
                </lui-dropdown-item>
                <lui-dropdown-item @lui-select=${openToast("default", "Preview opened", "You can wire dropdown items to any handler.")}>
                  Open preview
                </lui-dropdown-item>
                <lui-dropdown-separator></lui-dropdown-separator>
                <lui-dropdown-item @lui-select=${openToast("danger", "Removed", "Danger actions can still share the same primitive.")}>
                  Delete item
                </lui-dropdown-item>
              </lui-dropdown-content>
            </lui-dropdown-menu>
          </lui-card-content>
        </lui-card>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Tabs</lui-badge>
            <lui-card-title>Segmented content</lui-card-title>
            <lui-card-description>Tabs are file-light but still expressive enough for multi-pane demos.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <lui-tabs value="overview">
              <lui-tabs-list>
                <lui-tabs-trigger value="overview">Overview</lui-tabs-trigger>
                <lui-tabs-trigger value="tokens">Tokens</lui-tabs-trigger>
                <lui-tabs-trigger value="usage">Usage</lui-tabs-trigger>
              </lui-tabs-list>

              <lui-tabs-content value="overview">
                <div class="rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-sm leading-7 text-slate-300">
                  The package is intentionally small and composable. Components ship as custom elements so they can be dropped
                  into any Lit render tree without extra wrappers.
                </div>
              </lui-tabs-content>

              <lui-tabs-content value="tokens">
                <div class="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-sm leading-7 text-slate-300">
                  <div><strong class="text-white">Accent:</strong> <span class="text-lito-gold">gold / amber</span></div>
                  <div><strong class="text-white">Panel:</strong> deep slate with soft glass layering</div>
                  <div><strong class="text-white">Shape:</strong> rounded, high-comfort controls</div>
                </div>
              </lui-tabs-content>

              <lui-tabs-content value="usage">
                <div class="rounded-3xl border border-white/10 bg-slate-950/30 p-5 text-sm leading-7 text-slate-300">
                  Import <code class="rounded bg-white/10 px-2 py-1 text-slate-100">@litoho/ui</code> once in a page or layout,
                  then use tags like <code class="rounded bg-white/10 px-2 py-1 text-slate-100">&lt;lui-button&gt;</code>.
                </div>
              </lui-tabs-content>
            </lui-tabs>
          </lui-card-content>
        </lui-card>

        <lui-card>
          <lui-card-header>
            <lui-badge variant="outline">Dialog + Toast</lui-badge>
            <lui-card-title>Feedback layer</lui-card-title>
            <lui-card-description>Overlay interactions and ephemeral notifications work together nicely.</lui-card-description>
          </lui-card-header>
          <lui-card-content>
            <div class="flex flex-wrap gap-3">
              <lui-button @click=${openToast("success", "Changes saved", "Toast primitives are driven by an imperative helper.")}>
                Fire toast
              </lui-button>

              <lui-dialog>
                <lui-dialog-trigger>Open dialog</lui-dialog-trigger>
                <lui-dialog-content>
                  <lui-dialog-title>Ship the UI kit</lui-dialog-title>
                  <lui-dialog-description>
                    The dialog primitive is intentionally small but already supports overlay click and Escape-to-close.
                  </lui-dialog-description>
                  <lui-dialog-footer>
                    <lui-dialog-close>Close</lui-dialog-close>
                  </lui-dialog-footer>
                </lui-dialog-content>
              </lui-dialog>
            </div>
          </lui-card-content>
        </lui-card>
      </section>

      <lui-toast-region></lui-toast-region>
    </main>
  `
};

export default page;
