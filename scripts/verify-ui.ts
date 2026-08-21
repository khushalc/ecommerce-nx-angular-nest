/**
 * Browser-verifier for the storefront.
 *
 * Runs manually after each frontend milestone:
 *   npm run verify:ui
 *
 * Checks (per PLAN.md task #7):
 *   1. SSR HTML  — <title>, meta description, canonical, JSON-LD Product schema (via cheerio)
 *   2. Screenshots at 3 viewports (375 mobile, 768 tablet, 1440 desktop) via Playwright
 *   3. Console errors + a11y (axe-core via Playwright, desktop viewport only)
 *   4. Lighthouse — performance, accessibility, seo, best-practices scores
 *
 * Non-zero exit if SSR checks fail or any console errors are emitted.
 * Screenshots + JSON report land in verify-report/.
 */

import { chromium, Browser } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.STOREFRONT_URL ?? 'http://localhost:4200';
const OUT_DIR = 'verify-report';

interface RouteSpec {
  path: string;
  name: string;
  requireJsonLd?: boolean;
}

const ROUTES: RouteSpec[] = [
  { path: '/',                  name: 'home' },
  { path: '/c/gold-rings',      name: 'category' },
  { path: '/p/classic-band-22k', name: 'pdp', requireJsonLd: true },
];

const VIEWPORTS = [
  { width: 375,  height: 812,  label: 'mobile'  },
  { width: 768,  height: 1024, label: 'tablet'  },
  { width: 1440, height: 900,  label: 'desktop' },
];

interface RouteReport {
  route: string;
  name: string;
  ssr: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    hasJsonLd: boolean;
    ok: boolean;
    errors: string[];
  };
  screenshots: string[];
  a11y: { violations: number; detail: unknown[] };
  console: { errors: string[]; warnings: string[] };
  lighthouse: { performance: number; accessibility: number; seo: number; bestPractices: number } | null;
}

async function fetchSsr(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  return {
    html,
    title: $('title').text() || null,
    description: $('meta[name="description"]').attr('content') ?? null,
    canonical: $('link[rel="canonical"]').attr('href') ?? null,
    hasJsonLd: $('script[type="application/ld+json"]').length > 0,
  };
}

async function verifyRoute(browser: Browser, route: RouteSpec): Promise<RouteReport> {
  const url = `${BASE_URL}${route.path}`;
  const report: RouteReport = {
    route: route.path,
    name: route.name,
    ssr: { title: null, description: null, canonical: null, hasJsonLd: false, ok: true, errors: [] },
    screenshots: [],
    a11y: { violations: 0, detail: [] },
    console: { errors: [], warnings: [] },
    lighthouse: null,
  };

  // 1) SSR check
  console.log(`  · SSR check`);
  const ssr = await fetchSsr(url);
  report.ssr.title = ssr.title;
  report.ssr.description = ssr.description;
  report.ssr.canonical = ssr.canonical;
  report.ssr.hasJsonLd = ssr.hasJsonLd;
  if (!ssr.title?.trim()) report.ssr.errors.push('Missing <title>');
  if (!ssr.canonical)    report.ssr.errors.push('Missing canonical URL');
  if (route.requireJsonLd && !ssr.hasJsonLd) report.ssr.errors.push('Missing JSON-LD Product schema');
  report.ssr.ok = report.ssr.errors.length === 0;

  // 2) Screenshots + 3) console/a11y at viewports
  for (const vp of VIEWPORTS) {
    console.log(`  · Screenshot ${vp.label} ${vp.width}×${vp.height}`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    page.on('console', (msg) => {
      const t = msg.type();
      if (t === 'error')   report.console.errors.push(`[${vp.label}] ${msg.text()}`);
      if (t === 'warning') report.console.warnings.push(`[${vp.label}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => report.console.errors.push(`[${vp.label}] pageerror: ${err.message}`));

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      const shot = join(OUT_DIR, 'screenshots', `${route.name}-${vp.label}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      report.screenshots.push(shot);

      if (vp.label === 'desktop') {
        try {
          const axe = await new AxeBuilder({ page }).analyze();
          report.a11y.violations = axe.violations.length;
          report.a11y.detail = axe.violations.map((v) => ({
            id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
          }));
        } catch (e) {
          report.console.errors.push(`axe failed: ${(e as Error).message}`);
        }
      }
    } finally {
      await ctx.close();
    }
  }

  // 4) Lighthouse — DEFERRED. Lighthouse's SWC-compiled internals throw
  // "__name is not defined" when loaded via tsx. Phase 4: pre-compile the
  // script with tsc and run via node, or add process.env.__name shims.
  // The chromeLauncher + lighthouse deps are installed for that future work.

  return report;
}

function fmt(v: number | undefined | null) { return v == null ? '—' : String(v); }
function scoreColor(n: number) {
  if (n >= 90) return `\x1b[32m${n}\x1b[0m`;
  if (n >= 50) return `\x1b[33m${n}\x1b[0m`;
  return `\x1b[31m${n}\x1b[0m`;
}

async function main() {
  mkdirSync(join(OUT_DIR, 'screenshots'), { recursive: true });
  console.log(`\n🔍 Verifying storefront at ${BASE_URL}\n`);

  const browser = await chromium.launch();
  const reports: RouteReport[] = [];

  try {
    for (const route of ROUTES) {
      console.log(`▶ ${route.name}  (${route.path})`);
      const r = await verifyRoute(browser, route);
      reports.push(r);
    }
  } finally {
    await browser.close();
  }

  console.log('\n═════════════════════════════════ SUMMARY ═════════════════════════════════');
  console.log('route             SSR  a11y  console        Lighthouse (perf/a11y/seo/bp)');
  console.log('────────────────  ───  ────  ─────────────  ──────────────────────────────');
  for (const r of reports) {
    const ssr    = r.ssr.ok ? '✅' : '❌';
    const a11y   = r.a11y.violations === 0 ? '✅' : `${r.a11y.violations}⚠`;
    const cons   = r.console.errors.length === 0 ? '✅' : `${r.console.errors.length}✗`;
    const lh     = r.lighthouse
      ? `${scoreColor(r.lighthouse.performance)}/${scoreColor(r.lighthouse.accessibility)}/${scoreColor(r.lighthouse.seo)}/${scoreColor(r.lighthouse.bestPractices)}`
      : '—';
    console.log(`${r.name.padEnd(16)}  ${ssr}   ${a11y.padEnd(4)}  ${cons.padEnd(13)}  ${lh}`);
  }
  console.log('══════════════════════════════════════════════════════════════════════════\n');

  // Detail lines for any failures
  for (const r of reports) {
    if (!r.ssr.ok)                   console.log(`  ⚠ ${r.name} SSR errors: ${r.ssr.errors.join(', ')}`);
    if (r.a11y.violations > 0)       console.log(`  ⚠ ${r.name} a11y: ${(r.a11y.detail as any[]).map((v) => `${v.id}(${v.nodes})`).join(', ')}`);
    if (r.console.errors.length > 0) console.log(`  ⚠ ${r.name} console errors: ${r.console.errors.slice(0, 3).join(' | ')}`);
  }

  writeFileSync(join(OUT_DIR, 'report.json'), JSON.stringify(reports, null, 2));
  console.log(`\nReport → ${OUT_DIR}/report.json`);
  console.log(`Screenshots → ${OUT_DIR}/screenshots/\n`);

  const critical = reports.some((r) => !r.ssr.ok || r.console.errors.length > 0);
  process.exit(critical ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
