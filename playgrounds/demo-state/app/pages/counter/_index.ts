"use client";

import { html } from "lit";
import type { LitoPageModule } from "@lito/app";
import { memo, signal, watch } from "@lito/core";

const count = signal(3);
const doubled = memo(() => count.value * 2);
const status = memo(() => (count.value >= 10 ? "heated" : count.value >= 5 ? "warming" : "idle"));

watch(() => {
  console.log(`[counter-demo] count=${count.value} doubled=${doubled.value} status=${status.value}`);
}, [count, doubled, status]);

const page: LitoPageModule = {
  document: {
    title: "Counter | Lito Demo State",
    styles: ["body { margin: 0; font-family: \"IBM Plex Sans\", system-ui, sans-serif; } code { color: #f59e0b; }"]
  },
  render: () => html`
    <section style="max-width: 760px; margin: 0 auto; padding: 40px 24px 80px;">
      <div style="padding: 28px; border-radius: 28px; background: rgba(15, 23, 42, 0.84); border: 1px solid rgba(148, 163, 184, 0.16);">
        <div style="font-size: 0.84rem; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.14em;">Client-only page</div>
        <h2 style="margin: 12px 0 8px; font-size: 2.4rem;">Counter powered by Lito primitives</h2>
        <p style="margin: 0; color: #b9c7da; line-height: 1.7;">
          This route uses <code>"use client"</code>, so the server sends only the client root placeholder.
        </p>

        <div style="display: grid; gap: 14px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px;">
          <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
            <div style="font-size: 0.8rem; color: #94a3b8;">Count</div>
            <div style="font-size: 2.4rem; margin-top: 10px;">${count.value}</div>
          </div>
          <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
            <div style="font-size: 0.8rem; color: #94a3b8;">Doubled</div>
            <div style="font-size: 2.4rem; margin-top: 10px;">${doubled.value}</div>
          </div>
          <div style="padding: 18px; border-radius: 18px; background: rgba(2, 6, 23, 0.76);">
            <div style="font-size: 0.8rem; color: #94a3b8;">Status</div>
            <div style="font-size: 1.6rem; margin-top: 14px; text-transform: capitalize;">${status.value}</div>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px;">
          <button
            @click=${() => {
              console.log("[counter-demo] Decreasing count");
              count.value -= 1;
            }}
            style=${buttonStyle("#0f172a", "#cbd5e1")}
          >
            -1
          </button>
          <button
            @click=${() => {
              console.log("[counter-demo] Increasing count");
              count.value += 1;
            }}
            style=${buttonStyle("#0ea5e9", "#082f49")}
          >
            +1
          </button>
          <button
            @click=${() => {
              console.log("[counter-demo] Adding 100 to count");
              count.value += 100;
            }}
            style=${buttonStyle("#f59e0b", "#451a03")}
          >
            +100
          </button>
          <button
            @click=${() => {
              console.log("[counter-demo] Resetting count");
              count.value = 3;
            }}
            style=${buttonStyle("transparent", "#fecaca", "1px solid rgba(248, 113, 113, 0.55)")}
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  `
};

export default page;

function buttonStyle(background: string, color: string, border = "none") {
  return [
    `background: ${background}`,
    `color: ${color}`,
    `border: ${border}`,
    "padding: 10px 16px",
    "border-radius: 999px",
    "font: inherit",
    "cursor: pointer"
  ].join("; ");
}
