#!/usr/bin/env node
/**
 * Outreach pipeline manager for white-hat link building.
 *
 *   node seo-pipeline/backlinks/outreach.mjs --help
 *
 * THIS SCRIPT NEVER SENDS ANYTHING. It tracks state, enforces follow-up
 * discipline, and writes email drafts to stdout or a file. Sending is your job,
 * from your own mail client, after you have read what you are about to send.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DRAFTS_DIR,
  PIPELINE_FILE,
  PROSPECTS_FILE,
  REPO_ROOT,
  SITE,
  STATES,
  TEMPLATES_DIR,
  TRANSITIONS,
  addDays,
  c,
  daysSince,
  fmtDate,
  loadPipeline,
  loadProspects,
  nowISO,
  num,
  parseArgs,
  savePipeline,
  slug,
  table,
  truncate,
} from './lib.mjs';

const rel = (p) => path.relative(REPO_ROOT, p);

const HELP = `
${c.bold('outreach.mjs')} — white-hat backlink outreach pipeline (tracks; never sends)

${c.bold('Usage')}
  node seo-pipeline/backlinks/outreach.mjs <command> [options]

${c.bold('Commands')}
  list                        List pipeline entries
  prospects                   List the seeded prospect catalogue (prospects.json)
  add <prospect-id|--url ..>  Add a prospect (or an ad-hoc target) to the pipeline
  show <id>                   Full detail + history for one entry
  move <id> <state>           Move an entry to a new state
  note <id> <text>            Append a dated note
  followup <id>               Record that you sent a follow-up (enforces the cap)
  due                         What needs action today
  sweep                       Move lapsed entries to 'lost' (--apply to write)
  draft <id>                  Render an outreach email draft (stdout or --out)
  templates                   List available templates
  stats                       Pipeline counts, conversion, and link inventory

${c.bold('States')}
  ${STATES.join(' → ')}
  (nurture = keep warm, no active outreach; lost = closed, may be revisited)

${c.bold('Common options')}
  --state <s>        filter by state            --type <t>     filter by type
  --json             machine-readable output    --limit <n>    cap rows
  --note "<text>"    attach a note to move/add/followup
  --force            allow a non-standard state transition

${c.bold('add options')}
  --url <url>        target page URL (required for ad-hoc adds)
  --name <name>      display name
  --type <type>      community|newsletter|guest-post|resource-list|qa|directory|
                     edu-resource-page|podcast|aggregator|owned
  --contact <who>    name / email / form URL of the person you will contact
  --template <id>    template to use for the pitch
  --target <path>    the page on our site we want linked (e.g. /blog/some-slug)

${c.bold('draft options')}
  --template <id>    override the entry's template
  --set k=v          fill a placeholder (repeatable: --set first_name=Sam)
  --out <file>       write to a file instead of stdout
                     (default draft dir: ${rel(DRAFTS_DIR)}/)

${c.bold('Examples')}
  node seo-pipeline/backlinks/outreach.mjs prospects --type resource-list
  node seo-pipeline/backlinks/outreach.mjs add gh-awesome-scalability
  node seo-pipeline/backlinks/outreach.mjs move gh-awesome-scalability researched
  node seo-pipeline/backlinks/outreach.mjs draft freecodecamp-news --set first_name=Abbey
  node seo-pipeline/backlinks/outreach.mjs due
  node seo-pipeline/backlinks/outreach.mjs sweep --apply

${c.dim(`State lives in ${rel(PIPELINE_FILE)}. Catalogue lives in ${rel(PROSPECTS_FILE)}.`)}
${c.dim('No email is ever sent by this tool. Drafts are files. You press send.')}
`;

/* ---------------------------------------------------------------- helpers */

function findEntry(pipeline, id) {
  const e = pipeline.entries.find((x) => x.id === id);
  if (!e) {
    const near = pipeline.entries.filter((x) => x.id.includes(id)).map((x) => x.id);
    throw new Error(
      `no pipeline entry "${id}"${near.length ? `. Did you mean: ${near.join(', ')}` : '. Run `list` to see entries.'}`
    );
  }
  return e;
}

function findProspect(catalogue, id) {
  return catalogue.prospects.find((p) => p.id === id) || null;
}

/** Recompute nextActionAt / followUp obligations for an entry. */
function schedule(entry, config) {
  const fus = entry.followUps || [];
  if (entry.state === 'contacted') {
    const last = fus.length ? fus[fus.length - 1].at : entry.contactedAt;
    entry.nextActionAt = last ? addDays(last, config.followUpDays) : null;
    entry.nextAction =
      fus.length >= config.maxFollowUps
        ? `lapse to lost (${fus.length}/${config.maxFollowUps} follow-ups sent)`
        : `follow-up ${fus.length + 1}/${config.maxFollowUps}`;
  } else if (entry.state === 'replied') {
    entry.nextActionAt = entry.nextActionAt || addDays(entry.updatedAt, 2);
    entry.nextAction = 'reply to them';
  } else if (entry.state === 'researched') {
    entry.nextActionAt = addDays(entry.updatedAt, config.researchStaleDays);
    entry.nextAction = 'send the pitch';
  } else if (entry.state === 'identified') {
    entry.nextActionAt = addDays(entry.updatedAt, config.researchStaleDays);
    entry.nextAction = 'research the target + find a named contact';
  } else if (entry.state === 'won') {
    entry.nextActionAt = null;
    entry.nextAction = entry.linkUrl ? 'monitored by monitor.mjs' : 'record --link-url so monitor.mjs can watch it';
  } else {
    entry.nextActionAt = null;
    entry.nextAction = null;
  }
  return entry;
}

/** Entries whose scheduled action is due (or overdue) today. */
function dueEntries(pipeline) {
  const out = [];
  for (const e of pipeline.entries) {
    schedule(e, pipeline.config);
    if (!e.nextActionAt) continue;
    const overdueDays = daysSince(e.nextActionAt);
    if (overdueDays >= 0) out.push({ entry: e, overdueDays });
  }
  return out.sort((a, b) => b.overdueDays - a.overdueDays);
}

/** Contacted entries that have exhausted their follow-ups and gone quiet. */
function lapsed(pipeline) {
  return pipeline.entries.filter((e) => {
    if (e.state !== 'contacted') return false;
    const fus = e.followUps || [];
    if (fus.length < pipeline.config.maxFollowUps) return false;
    const last = fus[fus.length - 1].at;
    return daysSince(last) >= pipeline.config.followUpDays;
  });
}

function pushHistory(entry, from, to, note) {
  entry.history = entry.history || [];
  entry.history.push({ at: nowISO(), from, to, note: note || null });
}

const stateColor = {
  identified: c.dim,
  researched: c.cyan,
  contacted: c.blue,
  replied: c.magenta,
  won: c.green,
  lost: c.red,
  nurture: c.yellow,
};
const paint = (s) => (stateColor[s] || ((x) => x))(s);

/* --------------------------------------------------------------- commands */

function cmdProspects(catalogue, flags) {
  let list = catalogue.prospects;
  if (flags.type) list = list.filter((p) => p.type === flags.type);
  if (flags.difficulty) list = list.filter((p) => p.difficulty === flags.difficulty);
  if (flags['min-relevance']) list = list.filter((p) => p.relevance >= num(flags['min-relevance'], 0));
  if (flags.verify) list = list.filter((p) => p.verify);
  list = [...list].sort((a, b) => b.relevance - a.relevance || a.type.localeCompare(b.type));
  if (flags.limit) list = list.slice(0, num(flags.limit, list.length));

  if (flags.json) return console.log(JSON.stringify(list, null, 2));
  if (!list.length) return console.log('No prospects match that filter.');

  table(
    list.map((p) => [
      p.id,
      p.type,
      `${p.relevance}/5`,
      p.difficulty,
      p.payoff,
      p.verify ? 'verify' : '',
      truncate(p.name, 42),
    ]),
    ['ID', 'TYPE', 'FIT', 'DIFF', 'PAYOFF', 'FLAG', 'NAME']
  );
  console.log(
    c.dim(
      `\n${list.length} prospect(s). \`show\`-style detail: open ${rel(PROSPECTS_FILE)} — every entry has why/approach/rules.`
    )
  );
}

function cmdList(pipeline, flags) {
  let list = pipeline.entries.map((e) => schedule(e, pipeline.config));
  if (flags.state) list = list.filter((e) => e.state === flags.state);
  if (flags.type) list = list.filter((e) => e.type === flags.type);
  if (flags.limit) list = list.slice(0, num(flags.limit, list.length));

  if (flags.json) return console.log(JSON.stringify(list, null, 2));
  if (!list.length) {
    console.log('Pipeline is empty.');
    console.log(c.dim('Add one:  node seo-pipeline/backlinks/outreach.mjs add gh-awesome-scalability'));
    return;
  }
  const order = Object.fromEntries(STATES.map((s, i) => [s, i]));
  list.sort((a, b) => order[a.state] - order[b.state] || a.id.localeCompare(b.id));
  table(
    list.map((e) => [
      e.id,
      paint(e.state),
      e.type || '—',
      fmtDate(e.updatedAt),
      e.nextActionAt ? fmtDate(e.nextActionAt) : '—',
      truncate(e.nextAction || '', 34),
    ]),
    ['ID', 'STATE', 'TYPE', 'UPDATED', 'NEXT', 'ACTION']
  );
  console.log(c.dim(`\n${list.length} entr(ies) in ${rel(PIPELINE_FILE)}`));
}

function cmdAdd(pipeline, catalogue, args, flags) {
  const id = args[0];
  if (!id && !flags.url)
    throw new Error(
      'usage: add <prospect-id>   (see `prospects`)\n' +
        '   or: add --url <url> --name "<name>" --type <type>   (ad-hoc target)'
    );
  const p = id ? findProspect(catalogue, id) : null;
  if (id && !p && !flags.url) {
    throw new Error(
      `"${id}" is not in prospects.json. For an ad-hoc target pass --url (and ideally --name/--type).`
    );
  }
  const entryId = p ? p.id : slug(flags.name || flags.url || id || 'target');
  if (pipeline.entries.some((e) => e.id === entryId))
    throw new Error(`pipeline already has "${entryId}" — use \`move\` or \`note\``);

  const now = nowISO();
  const entry = {
    id: entryId,
    name: flags.name || p?.name || entryId,
    url: flags.url || p?.url || null,
    type: flags.type || p?.type || 'other',
    state: 'identified',
    contact: flags.contact || null,
    template: flags.template || p?.template || null,
    targetPath: flags.target || (p?.assets || []).find((a) => a.startsWith('/')) || null,
    anchorHint: flags.anchor || null,
    linkUrl: null,
    expectedRel: null,
    createdAt: now,
    updatedAt: now,
    contactedAt: null,
    followUps: [],
    notes: flags.note ? [{ at: now, text: flags.note }] : [],
    history: [],
    prospectRef: p ? p.id : null,
  };
  pushHistory(entry, null, 'identified', 'added');
  schedule(entry, pipeline.config);
  pipeline.entries.push(entry);
  savePipeline(pipeline);

  console.log(`${c.green('added')} ${entry.id}  (${entry.type})  → ${paint('identified')}`);
  if (p) {
    console.log(c.dim(`  ${p.url}`));
    console.log(`  ${c.bold('approach:')} ${p.approach}`);
    console.log(`  ${c.bold('rules:')}    ${c.yellow(p.rules)}`);
    if (p.verify) console.log(c.yellow('  ! verify: confirm the submission path/policy before investing time'));
  }
}

function cmdShow(pipeline, catalogue, args, flags) {
  const e = schedule(findEntry(pipeline, args[0]), pipeline.config);
  if (flags.json) return console.log(JSON.stringify(e, null, 2));
  const p = e.prospectRef ? findProspect(catalogue, e.prospectRef) : null;

  console.log(`${c.bold(e.name)}  ${c.dim(`(${e.id})`)}`);
  console.log(`  state      ${paint(e.state)}`);
  console.log(`  type       ${e.type}`);
  console.log(`  url        ${e.url || '—'}`);
  console.log(`  contact    ${e.contact || c.yellow('— (find a named person before pitching)')}`);
  console.log(`  template   ${e.template || '—'}`);
  console.log(`  we want    ${e.targetPath ? SITE.canonical + e.targetPath : '—'}`);
  console.log(`  earned     ${e.linkUrl || '—'}`);
  console.log(`  contacted  ${fmtDate(e.contactedAt)}   follow-ups ${(e.followUps || []).length}/${pipeline.config.maxFollowUps}`);
  console.log(`  next       ${e.nextAction || '—'}${e.nextActionAt ? ` on ${fmtDate(e.nextActionAt)}` : ''}`);
  if (p) {
    console.log(`\n  ${c.bold('why')}      ${p.why}`);
    console.log(`  ${c.bold('approach')} ${p.approach}`);
    console.log(`  ${c.bold('rules')}    ${c.yellow(p.rules)}`);
  }
  if (e.notes?.length) {
    console.log(`\n  ${c.bold('notes')}`);
    for (const n of e.notes) console.log(`    ${fmtDate(n.at)}  ${n.text}`);
  }
  if (e.history?.length) {
    console.log(`\n  ${c.bold('history')}`);
    for (const h of e.history)
      console.log(`    ${fmtDate(h.at)}  ${h.from || '∅'} → ${h.to}${h.note ? `  (${h.note})` : ''}`);
  }
}

function cmdMove(pipeline, args, flags) {
  const [id, to] = args;
  if (!to) throw new Error(`usage: move <id> <${STATES.join('|')}>`);
  if (!STATES.includes(to)) throw new Error(`unknown state "${to}". One of: ${STATES.join(', ')}`);
  const e = findEntry(pipeline, id);
  const from = e.state;
  if (from === to) throw new Error(`"${e.id}" is already ${to}`);
  if (!TRANSITIONS[from].includes(to) && !flags.force)
    throw new Error(
      `${from} → ${to} is not a normal transition (allowed: ${TRANSITIONS[from].join(', ')}). Use --force if you mean it.`
    );

  e.state = to;
  e.updatedAt = nowISO();
  if (to === 'contacted' && !e.contactedAt) e.contactedAt = e.updatedAt;
  if (to === 'won') {
    if (flags['link-url']) e.linkUrl = flags['link-url'];
    e.expectedRel = flags.rel || e.expectedRel || 'follow';
    if (!e.linkUrl)
      console.log(
        c.yellow('  ! no --link-url given — monitor.mjs cannot watch this link until you set one')
      );
  }
  if (flags.note) (e.notes = e.notes || []).push({ at: e.updatedAt, text: flags.note });
  pushHistory(e, from, to, flags.note);
  schedule(e, pipeline.config);
  savePipeline(pipeline);

  console.log(`${e.id}: ${paint(from)} → ${paint(to)}`);
  if (e.nextAction)
    console.log(c.dim(`  next: ${e.nextAction}${e.nextActionAt ? ` on ${fmtDate(e.nextActionAt)}` : ''}`));
}

function cmdNote(pipeline, args) {
  const [id, ...rest] = args;
  const text = rest.join(' ').trim();
  if (!text) throw new Error('usage: note <id> <text>');
  const e = findEntry(pipeline, id);
  (e.notes = e.notes || []).push({ at: nowISO(), text });
  e.updatedAt = nowISO();
  savePipeline(pipeline);
  console.log(`noted on ${e.id}: ${text}`);
}

function cmdFollowup(pipeline, args, flags) {
  const e = findEntry(pipeline, args[0]);
  if (e.state !== 'contacted')
    throw new Error(`"${e.id}" is ${e.state}; follow-ups only apply to contacted entries`);
  const fus = (e.followUps = e.followUps || []);
  if (fus.length >= pipeline.config.maxFollowUps)
    throw new Error(
      `"${e.id}" already had ${fus.length}/${pipeline.config.maxFollowUps} follow-ups. Stop chasing — run \`sweep --apply\` to close it out.`
    );
  const last = fus.length ? fus[fus.length - 1].at : e.contactedAt;
  const waited = daysSince(last);
  if (waited !== null && waited < pipeline.config.followUpDays && !flags.force)
    throw new Error(
      `only ${waited} day(s) since the last contact; the rule is ${pipeline.config.followUpDays}. Use --force to override (don't).`
    );

  fus.push({ at: nowISO(), note: flags.note || null });
  e.updatedAt = nowISO();
  pushHistory(e, 'contacted', 'contacted', `follow-up ${fus.length}`);
  schedule(e, pipeline.config);
  savePipeline(pipeline);
  console.log(
    `${e.id}: follow-up ${fus.length}/${pipeline.config.maxFollowUps} recorded. ${
      fus.length >= pipeline.config.maxFollowUps
        ? c.yellow('That was the last one — no more chasing.')
        : `Next due ${fmtDate(e.nextActionAt)}.`
    }`
  );
}

function cmdDue(pipeline, flags) {
  const due = dueEntries(pipeline);
  const lapse = lapsed(pipeline);
  if (flags.json)
    return console.log(
      JSON.stringify(
        {
          today: fmtDate(nowISO()),
          due: due.map((d) => ({ id: d.entry.id, action: d.entry.nextAction, overdueDays: d.overdueDays })),
          lapsing: lapse.map((e) => e.id),
        },
        null,
        2
      )
    );

  console.log(c.bold(`Due today (${fmtDate(nowISO())})`));
  if (!due.length) console.log(c.dim('  nothing due. Go write something worth linking to.'));
  else
    table(
      due.map((d) => [
        d.entry.id,
        paint(d.entry.state),
        d.overdueDays === 0 ? 'today' : `${d.overdueDays}d late`,
        truncate(d.entry.nextAction || '', 46),
        d.entry.contact || c.yellow('no contact yet'),
      ]),
      ['ID', 'STATE', 'WHEN', 'ACTION', 'CONTACT']
    );

  if (lapse.length) {
    console.log(`\n${c.yellow(c.bold('Lapsing'))} — follow-up cap reached, no reply:`);
    for (const e of lapse) console.log(`  ${e.id}  ${c.dim(`(contacted ${fmtDate(e.contactedAt)})`)}`);
    console.log(c.dim('  run `sweep --apply` to move these to lost'));
  }
}

function cmdSweep(pipeline, flags) {
  const lapse = lapsed(pipeline);
  if (!lapse.length) return console.log('Nothing to sweep.');
  for (const e of lapse) {
    console.log(
      `${flags.apply ? c.red('lost') : c.dim('would close')}  ${e.id}  ${c.dim(
        `(${(e.followUps || []).length} follow-ups, silent since ${fmtDate(
          (e.followUps || []).at(-1)?.at || e.contactedAt
        )})`
      )}`
    );
    if (flags.apply) {
      pushHistory(e, e.state, 'lost', 'auto-lapsed: follow-up cap reached with no reply');
      e.state = 'lost';
      e.updatedAt = nowISO();
      schedule(e, pipeline.config);
    }
  }
  if (flags.apply) {
    savePipeline(pipeline);
    console.log(c.dim(`\n${lapse.length} moved to lost. Revisit later with \`move <id> nurture\`.`));
  } else {
    console.log(c.dim('\ndry run — pass --apply to write'));
  }
}

/* --------------------------------------------------------------- drafting */

function listTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => ({ file: path.join(TEMPLATES_DIR, f), id: f.replace(/\.md$/, '') }));
}

function loadTemplate(id) {
  const found = listTemplates().find((t) => t.id === id);
  if (!found)
    throw new Error(
      `no template "${id}". Available: ${listTemplates().map((t) => t.id).join(', ') || '(none)'}`
    );
  const raw = fs.readFileSync(found.file, 'utf8');
  const meta = {};
  let body = raw;
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    body = raw.slice(fm[0].length);
  }
  // everything before the "How to personalize" heading is the sendable body
  const cut = body.search(/^##\s+How to personalize/m);
  const guidance = cut === -1 ? '' : body.slice(cut).trim();
  body = (cut === -1 ? body : body.slice(0, cut)).trim();
  return { id, file: found.file, meta, body, guidance };
}

function fill(text, values) {
  const missing = new Set();
  const out = text.replace(/\{\{(\w+)\}\}/g, (m, k) => {
    if (values[k] !== undefined && values[k] !== null && values[k] !== '') return values[k];
    missing.add(k);
    return m;
  });
  return { out, missing: [...missing] };
}

function cmdDraft(pipeline, catalogue, args, flags) {
  const e = findEntry(pipeline, args[0]);
  const p = e.prospectRef ? findProspect(catalogue, e.prospectRef) : null;
  const tplId = flags.template || e.template;
  if (!tplId)
    throw new Error(
      `"${e.id}" has no template. Pass --template <id>. Available: ${listTemplates().map((t) => t.id).join(', ')}`
    );
  const tpl = loadTemplate(tplId);

  const values = {
    my_name: SITE.author,
    my_url: e.targetPath ? SITE.canonical + e.targetPath : SITE.canonical,
    page_url: e.url || '',
    page_title: e.name || '',
    publication: e.name || '',
    newsletter: e.name || '',
    show: e.name || '',
    org: e.name || '',
    first_name: e.contact && !/[@/]/.test(e.contact) ? e.contact.split(/\s+/)[0] : '',
  };
  for (const kv of [].concat(flags.set || [])) {
    const i = String(kv).indexOf('=');
    if (i > 0) values[String(kv).slice(0, i)] = String(kv).slice(i + 1);
  }

  const subject = fill(tpl.meta.subject || `Re: ${e.name}`, values);
  const body = fill(tpl.body, values);
  const missing = [...new Set([...subject.missing, ...body.missing])];

  const doc = [
    `To:      ${e.contact || '<< FIND A NAMED PERSON — do not send to info@ >>'}`,
    `Subject: ${subject.out}`,
    '',
    body.out,
    '',
  ].join('\n');

  const header = [
    `# DRAFT — ${e.name} (${e.id})`,
    `# template: ${tpl.id}    generated: ${fmtDate(nowISO())}`,
    '# NOT SENT. This tool never sends email. Read it, edit it, then send it yourself.',
    p?.rules ? `#\n# RULES FOR THIS TARGET:\n# ${p.rules.replace(/\n/g, '\n# ')}` : '',
    missing.length ? `#\n# UNFILLED: ${missing.join(', ')}  → --set key=value` : '',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  if (flags.out !== undefined) {
    const outPath =
      flags.out === true
        ? path.join(DRAFTS_DIR, `${fmtDate(nowISO())}-${e.id}-${tpl.id}.md`)
        : path.resolve(flags.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${header}\n${doc}`, 'utf8');
    console.log(`draft written → ${rel(outPath)}`);
    if (missing.length) console.log(c.yellow(`  unfilled placeholders: ${missing.join(', ')}`));
  } else {
    console.log(c.dim(header));
    console.log(doc);
    if (missing.length) console.log(c.yellow(`\n! unfilled placeholders: ${missing.join(', ')}  (--set key=value)`));
  }
  if (tpl.guidance) console.log(c.dim(`\n${tpl.guidance}`));
  console.log(c.bold(c.green('\nNothing was sent. Copy this into your mail client when you are happy with it.')));
}

function cmdTemplates(flags) {
  const tpls = listTemplates().map((t) => loadTemplate(t.id));
  if (flags.json) return console.log(JSON.stringify(tpls.map(({ id, meta }) => ({ id, ...meta })), null, 2));
  table(
    tpls.map((t) => [t.id, truncate(t.meta.name || '', 40), truncate(t.meta.placeholders || '', 60)]),
    ['ID', 'NAME', 'PLACEHOLDERS']
  );
}

function cmdStats(pipeline, catalogue, flags) {
  const byState = Object.fromEntries(STATES.map((s) => [s, 0]));
  const byType = {};
  for (const e of pipeline.entries) {
    byState[e.state] = (byState[e.state] || 0) + 1;
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  const contacted = pipeline.entries.filter((e) => e.contactedAt).length;
  const won = byState.won || 0;
  const closed = won + (byState.lost || 0);
  const wonWithUrl = pipeline.entries.filter((e) => e.state === 'won' && e.linkUrl).length;

  const stats = {
    catalogue: catalogue.prospects.length,
    inPipeline: pipeline.entries.length,
    byState,
    byType,
    contacted,
    replyRate: contacted ? +(((byState.replied || 0) + won) / contacted * 100).toFixed(1) : null,
    winRateOfContacted: contacted ? +((won / contacted) * 100).toFixed(1) : null,
    winRateOfClosed: closed ? +((won / closed) * 100).toFixed(1) : null,
    monitorable: wonWithUrl,
    unmonitorableWins: won - wonWithUrl,
  };
  if (flags.json) return console.log(JSON.stringify(stats, null, 2));

  console.log(c.bold('Pipeline'));
  for (const s of STATES) console.log(`  ${paint(s.padEnd(11))} ${byState[s] || 0}`);
  console.log(`  ${'—'.padEnd(11)} ${pipeline.entries.length} total  ${c.dim(`(catalogue: ${stats.catalogue})`)}`);

  console.log(`\n${c.bold('By type')}`);
  for (const [t, n] of Object.entries(byType).sort((a, b) => b[1] - a[1])) console.log(`  ${t.padEnd(20)} ${n}`);

  console.log(`\n${c.bold('Rates')}`);
  console.log(`  contacted            ${contacted}`);
  console.log(`  reply rate           ${stats.replyRate ?? '—'}${stats.replyRate != null ? '%' : ''}`);
  console.log(`  win rate (contacted) ${stats.winRateOfContacted ?? '—'}${stats.winRateOfContacted != null ? '%' : ''}`);
  console.log(`  win rate (closed)    ${stats.winRateOfClosed ?? '—'}${stats.winRateOfClosed != null ? '%' : ''}`);
  if (stats.unmonitorableWins > 0)
    console.log(c.yellow(`\n  ! ${stats.unmonitorableWins} won entr(ies) have no linkUrl — monitor.mjs cannot check them`));
  console.log(
    c.dim(
      '\n  A 5-15% reply rate on genuinely personalised outreach is normal. If yours is near zero,\n  the problem is the pitch or the target list, not the volume — sending more is the wrong fix.'
    )
  );
}

/* ------------------------------------------------------------------- main */

async function main(argv) {
  const { _, flags } = parseArgs(argv, { booleans: ['apply', 'verify', 'dry-run'] });
  const cmd = _[0];
  if (flags.help || !cmd) {
    console.log(HELP);
    return 0;
  }
  // allow repeatable --set
  const rawSets = argv.filter((a, i) => argv[i - 1] === '--set' || a.startsWith('--set='));
  if (rawSets.length) flags.set = rawSets.map((s) => (s.startsWith('--set=') ? s.slice(6) : s));

  const catalogue = loadProspects();
  const pipeline = loadPipeline();
  const args = _.slice(1);

  switch (cmd) {
    case 'prospects': cmdProspects(catalogue, flags); break;
    case 'list':      cmdList(pipeline, flags); break;
    case 'add':       cmdAdd(pipeline, catalogue, args, flags); break;
    case 'show':      cmdShow(pipeline, catalogue, args, flags); break;
    case 'move':      cmdMove(pipeline, args, flags); break;
    case 'note':      cmdNote(pipeline, args); break;
    case 'followup':  cmdFollowup(pipeline, args, flags); break;
    case 'due':       cmdDue(pipeline, flags); break;
    case 'sweep':     cmdSweep(pipeline, flags); break;
    case 'draft':     cmdDraft(pipeline, catalogue, args, flags); break;
    case 'templates': cmdTemplates(flags); break;
    case 'stats':     cmdStats(pipeline, catalogue, flags); break;
    default:
      console.error(`Unknown command "${cmd}".`);
      console.log(HELP);
      return 1;
  }
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(c.red(`error: ${e.message}`));
    process.exitCode = 1;
  }
}
