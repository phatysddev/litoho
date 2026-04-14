"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { batch, store } from "@lito/core";

const profile = store({
  name: "Lito Operator",
  role: "Framework Engineer",
  theme: "amber" as "amber" | "ocean",
  notifications: true
});

const page: LitoPageModule = {
  document: {
    title: "Store | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; }"]
  },
  render: () => {
    const current = profile.get();

    return html`
      <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
        <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
          <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">store() demo</div>
          <h2 style="margin: 12px 0 8px; font-size: 2.2rem;">Object state through a single framework store</h2>
          <div style="display: grid; gap: 14px; margin-top: 22px;">
            ${renderField("Name", current.name, () => {
              const nextName = prompt("Name", profile.get("name"));
              if (nextName) profile.set("name", nextName);
            })}
            ${renderField("Role", current.role, () => {
              const nextRole = prompt("Role", profile.get("role"));
              if (nextRole) profile.set("role", nextRole);
            })}
            ${renderField("Theme", current.theme, () => {
              profile.set("theme", profile.get("theme") === "amber" ? "ocean" : "amber");
            })}
            ${renderField("Notifications", current.notifications ? "Enabled" : "Muted", () => {
              profile.set("notifications", !profile.get("notifications"));
            })}
          </div>
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button
              @click=${() => {
                batch(() => {
                  profile.set({
                    name: "DX Captain",
                    role: "Platform Builder",
                    theme: "ocean",
                    notifications: false
                  });
                });
              }}
              style=${actionButton("#f59e0b", "#451a03")}
            >
              Load Preset
            </button>
          </div>
        </div>
      </section>
    `;
  }
};

export default page;

function renderField(label: string, value: string, onClick: () => void) {
  return html`
    <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
      <div>
        <div style="font-size: 0.82rem; color: #94a3b8;">${label}</div>
        <div style="margin-top: 6px; font-size: 1.05rem;">${value}</div>
      </div>
      <button @click=${onClick} style=${actionButton("#0f172a", "#dbe7f5")}>Change</button>
    </div>
  `;
}

function actionButton(background: string, color: string) {
  return [
    `background: ${background}`,
    `color: ${color}`,
    "border: 1px solid rgba(148, 163, 184, 0.2)",
    "padding: 10px 14px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
