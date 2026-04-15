import { html } from "lit";
import type { LitoPageModule } from "@litoho/app";

const page: LitoPageModule = {
  document: {
    title: "Basic Routing Example"
  },
  render: () => html`
    <main>
      <style>
        :root {
          color-scheme: dark;
        }

        .landing-shell {
          position: relative;
          overflow: clip;
        }

        .landing-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(circle at 18% 22%, rgba(251, 191, 36, 0.2), transparent 28%),
            radial-gradient(circle at 78% 16%, rgba(56, 189, 248, 0.24), transparent 24%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 18%);
          pointer-events: none;
          z-index: 0;
        }

        .landing-shell::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 82%);
          pointer-events: none;
          z-index: 0;
        }

        .hero {
          position: relative;
          z-index: 1;
          min-height: 100svh;
          display: grid;
          align-items: end;
          padding: 28px 22px 56px;
        }

        .hero-inner {
          width: min(1120px, 100%);
          margin: 0 auto;
          display: grid;
          gap: 28px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #facc15;
          opacity: 0.92;
          animation: rise 700ms ease-out both;
        }

        .eyebrow::before {
          content: "";
          width: 54px;
          height: 1px;
          background: currentColor;
        }

        .brand {
          margin: 0;
          font-size: clamp(3.8rem, 13vw, 9rem);
          line-height: 0.9;
          letter-spacing: -0.07em;
          text-transform: uppercase;
          color: #f8fafc;
          animation: rise 800ms ease-out both;
        }

        .brand span {
          display: block;
          color: rgba(244, 114, 182, 0.92);
        }

        .hero-grid {
          display: grid;
          gap: 28px;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
          align-items: end;
        }

        .lead {
          max-width: 34rem;
          margin: 0;
          font-size: clamp(1.02rem, 2.6vw, 1.25rem);
          line-height: 1.75;
          color: rgba(226, 232, 240, 0.88);
          animation: rise 950ms ease-out both;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          margin-top: 26px;
          animation: rise 1100ms ease-out both;
        }

        .primary-link,
        .secondary-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 20px;
          border-radius: 999px;
          text-decoration: none;
          transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }

        .primary-link {
          background: #f8fafc;
          color: #07101f;
          font-weight: 700;
        }

        .secondary-link {
          border: 1px solid rgba(248, 250, 252, 0.22);
          color: #f8fafc;
          backdrop-filter: blur(10px);
        }

        .primary-link:hover,
        .secondary-link:hover {
          transform: translateY(-2px);
        }

        .signal {
          justify-self: end;
          width: min(100%, 360px);
          padding: 24px 0 0;
          border-top: 1px solid rgba(248, 250, 252, 0.18);
          color: rgba(226, 232, 240, 0.82);
          animation: floatIn 1050ms ease-out both;
        }

        .signal-label {
          margin: 0 0 10px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #facc15;
        }

        .signal-copy {
          margin: 0;
          font-size: 1rem;
          line-height: 1.7;
        }

        .sections {
          position: relative;
          z-index: 1;
          width: min(1120px, calc(100% - 44px));
          margin: 0 auto;
          padding-bottom: 72px;
        }

        .feature-band,
        .route-list,
        .closing {
          display: grid;
          gap: 20px;
          padding: 36px 0;
          border-top: 1px solid rgba(248, 250, 252, 0.12);
        }

        .feature-band {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .feature-copy small,
        .route-header small,
        .closing small {
          display: block;
          margin-bottom: 12px;
          color: #facc15;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.72rem;
        }

        .feature-copy h2,
        .route-header h2,
        .closing h2 {
          margin: 0;
          font-size: clamp(1.7rem, 5vw, 2.6rem);
          line-height: 1.08;
          letter-spacing: -0.05em;
        }

        .feature-copy p,
        .route-header p,
        .closing p {
          margin: 10px 0 0;
          max-width: 32rem;
          line-height: 1.7;
          color: rgba(226, 232, 240, 0.8);
        }

        .feature-stat {
          align-self: end;
          font-size: clamp(2rem, 6vw, 4rem);
          line-height: 0.95;
          letter-spacing: -0.07em;
          color: rgba(248, 250, 252, 0.92);
        }

        .route-list {
          grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
          align-items: start;
        }

        .route-items {
          display: grid;
          gap: 18px;
        }

        .route-item {
          display: grid;
          grid-template-columns: 132px minmax(0, 1fr);
          gap: 18px;
          padding: 18px 0;
          border-top: 1px solid rgba(248, 250, 252, 0.08);
          text-decoration: none;
          color: inherit;
          transition: transform 180ms ease, border-color 180ms ease;
        }

        .route-item:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .route-item:hover {
          transform: translateX(6px);
          border-color: rgba(250, 204, 21, 0.45);
        }

        .route-path {
          font-size: 0.78rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(250, 204, 21, 0.9);
        }

        .route-body strong {
          display: block;
          font-size: 1.1rem;
        }

        .route-body span {
          display: block;
          margin-top: 8px;
          line-height: 1.7;
          color: rgba(226, 232, 240, 0.78);
        }

        .closing {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
        }

        .closing-note {
          margin: 0;
          max-width: 23rem;
          color: rgba(226, 232, 240, 0.82);
          line-height: 1.7;
        }

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(26px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 880px) {
          .hero-grid,
          .feature-band,
          .route-list,
          .closing {
            grid-template-columns: 1fr;
          }

          .signal {
            justify-self: start;
          }

          .route-item {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .hero {
            padding: 22px 18px 44px;
          }

          .sections {
            width: min(100% - 36px, 1120px);
          }

          .brand {
            font-size: clamp(3.2rem, 18vw, 5.4rem);
          }

          .actions {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-link,
          .secondary-link {
            width: 100%;
          }
        }
      </style>

      <div class="landing-shell">
        <section class="hero">
          <div class="hero-inner">
            <div class="eyebrow">Litoho Example</div>
            <h1 class="brand">Basic<span>Routing</span></h1>
            <div class="hero-grid">
              <div>
                <p class="lead">
                  A cinematic starter page for Litoho that turns file-based routing, layouts, route params, and SSR into
                  something you can explore in minutes instead of reading about for an hour.
                </p>
                <div class="actions">
                  <a class="primary-link" href="/docs/getting-started">Open Docs Route</a>
                  <a class="secondary-link" href="/server-snapshot?source=basic-routing">View SSR Snapshot</a>
                </div>
              </div>
              <div class="signal">
                <p class="signal-label">Why this page exists</p>
                <p class="signal-copy">
                  The first screen behaves like a poster, while the sections below point directly at the routes that prove
                  how the framework is wired.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div class="sections">
          <section class="feature-band">
            <div class="feature-copy">
              <small>One Structure</small>
              <h2>Folders become the map.</h2>
              <p>
                `_index.ts`, `_layout.ts`, and dynamic segments stay visible in the filesystem, so the example teaches the
                convention by being the convention.
              </p>
            </div>
            <div class="feature-stat">4x</div>
            <div class="feature-copy">
              <small>Four angles</small>
              <p>
                Nested docs pages, parameterized routes, server-rendered data, and special error states all live side by side
                in one compact example app.
              </p>
            </div>
          </section>

          <section class="route-list">
            <div class="route-header">
              <small>Explore the routes</small>
              <h2>Every link is a different part of the framework.</h2>
              <p>Use these routes as a visual checklist when you want to understand the current Litoho page model.</p>
            </div>
            <div class="route-items">
              <a class="route-item" href="/docs/getting-started">
                <div class="route-path">/docs/getting-started</div>
                <div class="route-body">
                  <strong>Nested layout flow</strong>
                  <span>Shows how a route inherits structure from the `docs/_layout.ts` chain.</span>
                </div>
              </a>
              <a class="route-item" href="/docs/reference">
                <div class="route-path">/docs/reference</div>
                <div class="route-body">
                  <strong>Second sibling page</strong>
                  <span>Useful for checking route scanning and seeing the same layout reused across a section.</span>
                </div>
              </a>
              <a class="route-item" href="/blog/hello-litoho">
                <div class="route-path">/blog/[slug]</div>
                <div class="route-body">
                  <strong>Dynamic segment</strong>
                  <span>Demonstrates parameter-based routing with a human-readable URL right away.</span>
                </div>
              </a>
              <a class="route-item" href="/server-snapshot?source=basic-routing">
                <div class="route-path">/server-snapshot</div>
                <div class="route-body">
                  <strong>SSR load pipeline</strong>
                  <span>Renders data from `load()` and makes the route feel like a server-first document.</span>
                </div>
              </a>
              <a class="route-item" href="/missing-route">
                <div class="route-path">/_not-found</div>
                <div class="route-body">
                  <strong>Special pages</strong>
                  <span>Jumps straight into the custom 404 experience so you can verify the fallback path.</span>
                </div>
              </a>
            </div>
          </section>

          <section class="closing">
            <div>
              <small>Next Move</small>
              <h2>Use this page as the baseline for the rest of your examples.</h2>
            </div>
            <p class="closing-note">
              The same art direction can branch into middleware, state, and CRUD examples while keeping the repo feeling like
              one framework instead of unrelated demos.
            </p>
          </section>
        </div>
      </div>
    </main>
  `
};

export default page;
