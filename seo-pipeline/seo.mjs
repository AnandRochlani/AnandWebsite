#!/usr/bin/env node
/**
 * SEO pipeline orchestrator.
 *
 * Runs the stages of the pipeline in dependency order and prints one clear report.
 * Every stage is optional: a stage whose script is missing is reported as SKIPPED
 * rather than failing the run, so the pipeline still works while modules are added.
 *
 *   node seo-pipeline/seo.mjs check      # read-only: QA drafts, links, audit live site
 *   node seo-pipeline/seo.mjs build      # sitemap + production build + prerender
 *   node seo-pipeline/seo.mjs publish    # publish drafts, then build (needs admin creds)
 *   node seo-pipeline/seo.mjs submit     # IndexNow submission (dry run unless --yes)
 *   node seo-pipeline/seo.mjs all        # check → build → submit
 *
 * Flags: --yes (allow write/submit stages to act), --base <url>, --quiet
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');

const argv = process.argv.slice(2);
const command = argv.find((a) => !a.startsWith('--')) || 'check';
const has = (f) => argv.includes(f);
const flagValue = (f, d = null) => {
  const i = argv.indexOf(f);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};

const YES = has('--yes');
const QUIET = has('--quiet');
const BASE = flagValue('--base', 'https://anandrochlani.com');

if (has('--help') || has('-h') || command === 'help') {
  console.log(`
seo.mjs — run the anandrochlani.com SEO pipeline

  check      QA article drafts, internal-link report, live technical audit  (read-only)
  build      regenerate sitemap, production build, prerender static HTML
  publish    publish drafted articles via the admin API, then build         (needs --yes)
  submit     IndexNow submission to Bing/Yandex                             (needs --yes to send)
  all        check → build → submit

  --yes      allow stages that write or submit to actually act
  --base     origin to audit / pull content from (default https://anandrochlani.com)
  --quiet    only print stage results, not their output
`);
  process.exit(0);
}

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[36m',
};

const exists = (rel) => fs.existsSync(path.join(REPO, rel));

function run(cmd, args, { cwd = REPO } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: QUIET ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      env: process.env,
    });
    let buf = '';
    if (QUIET) {
      child.stdout.on('data', (d) => (buf += d));
      child.stderr.on('data', (d) => (buf += d));
    }
    child.on('close', (code) => resolve({ code, output: buf }));
    child.on('error', (e) => resolve({ code: 1, output: e.message }));
  });
}

const results = [];

async function stage(name, { script, cmd, args, needsYes = false, optional = true, note = '' }) {
  if (script && !exists(script)) {
    results.push({ name, status: 'SKIPPED', detail: `${script} not present` });
    console.log(`\n${C.dim}▸ ${name} — SKIPPED (${script} not present)${C.reset}`);
    return;
  }
  if (needsYes && !YES) {
    results.push({ name, status: 'SKIPPED', detail: 'needs --yes' });
    console.log(`\n${C.yellow}▸ ${name} — SKIPPED (re-run with --yes to act)${C.reset}`);
    return;
  }

  console.log(`\n${C.bold}${C.blue}▸ ${name}${C.reset}${note ? ` ${C.dim}${note}${C.reset}` : ''}`);
  const { code, output } = await run(cmd, args);
  if (QUIET && code !== 0) console.log(output);

  const ok = code === 0;
  results.push({ name, status: ok ? 'OK' : optional ? 'WARN' : 'FAIL', detail: `exit ${code}` });
  console.log(
    ok
      ? `${C.green}  ✓ ${name}${C.reset}`
      : `${optional ? C.yellow : C.red}  ${optional ? '!' : '✗'} ${name} (exit ${code})${C.reset}`
  );
}

async function doCheck() {
  await stage('QA article drafts', {
    script: 'seo-pipeline/qa.mjs',
    cmd: 'node', args: ['seo-pipeline/qa.mjs'],
  });
  await stage('Internal link report', {
    script: 'seo-pipeline/internal-links.mjs',
    cmd: 'node', args: ['seo-pipeline/internal-links.mjs'],
  });
  await stage('Technical SEO audit', {
    script: 'seo-pipeline/audit.mjs',
    cmd: 'node', args: ['seo-pipeline/audit.mjs', '--base', BASE],
    note: `(${BASE})`,
  });
}

async function doBuild() {
  await stage('Regenerate sitemap', {
    script: 'seo-pipeline/generate-sitemap.mjs',
    cmd: 'node', args: ['seo-pipeline/generate-sitemap.mjs'],
  });
  await stage('Production build + prerender', {
    cmd: 'npm', args: ['run', 'build'], optional: false,
  });
}

async function doPublish() {
  await stage('Publish drafted articles', {
    script: 'seo-pipeline/publish.mjs',
    cmd: 'node', args: ['seo-pipeline/publish.mjs', '--yes'],
    needsYes: true, optional: false,
    note: '(admin API — needs ADMIN_USERNAME / ADMIN_PASSWORD)',
  });
  await doBuild();
}

async function doSubmit() {
  await stage('IndexNow submission', {
    script: 'seo-pipeline/indexing/indexnow.mjs',
    cmd: 'node',
    args: ['seo-pipeline/indexing/indexnow.mjs', '--new', ...(YES ? ['--yes'] : [])],
    note: YES ? '(live)' : '(dry run — add --yes to send)',
  });
}

const commands = { check: doCheck, build: doBuild, publish: doPublish, submit: doSubmit };

async function main() {
  console.log(`${C.bold}SEO pipeline — ${command}${C.reset}`);

  if (command === 'all') {
    await doCheck();
    await doBuild();
    await doSubmit();
  } else if (commands[command]) {
    await commands[command]();
  } else {
    console.error(`Unknown command "${command}". Try --help.`);
    process.exit(1);
  }

  console.log(`\n${C.bold}══ Summary ══${C.reset}`);
  for (const r of results) {
    const colour =
      r.status === 'OK' ? C.green : r.status === 'SKIPPED' ? C.dim : r.status === 'WARN' ? C.yellow : C.red;
    console.log(`  ${colour}${r.status.padEnd(8)}${C.reset} ${r.name} ${C.dim}${r.detail}${C.reset}`);
  }

  const failed = results.filter((r) => r.status === 'FAIL');
  if (failed.length) {
    console.log(`\n${C.red}${failed.length} stage(s) failed.${C.reset}`);
    process.exit(1);
  }
  const warned = results.filter((r) => r.status === 'WARN');
  if (warned.length) {
    console.log(
      `\n${C.yellow}${warned.length} stage(s) reported findings — review the output above.${C.reset}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
