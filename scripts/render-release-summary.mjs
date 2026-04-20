import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const rootDir = process.cwd();
const args = process.argv.slice(2);
const reportPath = resolve(rootDir, readFlagValue(args, "--report") ?? process.env.LITOHO_RELEASE_REPORT ?? "release-report.json");
const outputPath = readFlagValue(args, "--out");

if (!existsSync(reportPath)) {
  console.error(`[Litoho release summary] report not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const markdown = renderSummary(report, reportPath);

if (outputPath) {
  const resolvedOutputPath = resolve(rootDir, outputPath);
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, markdown);
  console.log(`[Litoho release summary] wrote ${resolvedOutputPath}`);
} else {
  process.stdout.write(markdown);
}

function renderSummary(currentReport, currentReportPath) {
  const lines = [];
  const status = currentReport.status ?? "warning";
  const steps = currentReport.steps ?? {};

  lines.push("# Litoho Release Summary");
  lines.push("");
  lines.push(`- Report: \`${currentReportPath}\``);
  lines.push(`- Status: **${status.toUpperCase()}**`);
  if (currentReport.generatedAt) {
    lines.push(`- Generated At: \`${currentReport.generatedAt}\``);
  }
  lines.push("");
  lines.push("## Steps");
  lines.push("");

  for (const [stepName, step] of Object.entries(steps)) {
    lines.push(`- \`${stepName}\`: **${String(step?.status ?? "unknown").toUpperCase()}**`);
  }

  const preflight = steps.preflight;
  if (preflight) {
    lines.push("");
    lines.push("## Preflight");
    lines.push("");
    lines.push(`- Scope: \`${preflight.scope ?? "unknown"}\``);
    lines.push(`- CLI Package: \`${preflight.cliPackageName ?? "unknown"}\``);
    lines.push(`- CLI Bin: \`${preflight.cliBin ?? "unknown"}\``);
    if (Array.isArray(preflight.packages)) {
      lines.push(`- Packages Checked: ${preflight.packages.length}`);
    }
  }

  const smoke = steps.smoke;
  if (smoke) {
    lines.push("");
    lines.push("## Smoke");
    lines.push("");
    lines.push(`- Mode: \`${smoke.mode ?? "unknown"}\``);
    lines.push(`- App Name: \`${smoke.appName ?? "unknown"}\``);
    lines.push(`- Install: \`${String(Boolean(smoke.install))}\``);
    lines.push(`- Build: \`${String(Boolean(smoke.build))}\``);
    lines.push(`- Start Probe: \`${String(Boolean(smoke.startProbeVerified))}\``);
  }

  const verify = steps.verify;
  if (verify) {
    lines.push("");
    lines.push("## Verify");
    lines.push("");
    lines.push(`- Published Mode: \`${String(Boolean(verify.published))}\``);
    lines.push(`- Skip Test: \`${String(Boolean(verify.skipTest))}\``);
    if (Array.isArray(verify.steps) && verify.steps.length > 0) {
      lines.push("- Step Results:");
      for (const step of verify.steps) {
        lines.push(`  - \`${step.name}\`: ${String(step.status ?? "unknown")}`);
      }
    }
  }

  const publish = steps.publish;
  if (publish) {
    lines.push("");
    lines.push("## Publish");
    lines.push("");
    lines.push(`- Dry Run: \`${String(Boolean(publish.dryRun))}\``);
    lines.push(`- Skip Verify: \`${String(Boolean(publish.skipVerify))}\``);
    lines.push(`- Verify Published: \`${String(Boolean(publish.verifyPublished))}\``);
    if (publish.releaseVersion) {
      lines.push(`- Release Version: \`${publish.releaseVersion}\``);
    }
    if (Array.isArray(publish.packages) && publish.packages.length > 0) {
      lines.push("- Package Results:");
      for (const pkg of publish.packages) {
        lines.push(`  - \`${pkg.name}\`: ${String(pkg.status ?? "unknown")}`);
      }
    }
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function readFlagValue(inputArgs, flagName) {
  const index = inputArgs.indexOf(flagName);
  return index >= 0 ? inputArgs[index + 1] : undefined;
}
