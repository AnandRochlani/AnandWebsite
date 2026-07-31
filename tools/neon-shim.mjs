// In-process @neondatabase/serverless replacement for local verification.
//
// Exposes a `neon(url)` function that returns a tagged-template SQL function
// with a `.transaction(queries)` method, matching the surface area used by
// api/_db.js and api/admin/settings.js. Backed by pg-mem (pure JS, no
// native deps).
//
// This file is consumed by tools/neon-loader.mjs, which redirects
// `import { neon } from '@neondatabase/serverless'` to it.

import { newDb } from 'pg-mem';

let dbInstance = null;
let pgClient = null;

function ensureDb() {
  if (dbInstance) return dbInstance;
  dbInstance = newDb({ autoCreateForeignKeyIndices: true });

  // pg-mem doesn't ship pg_get_serial_sequence/setval. The seed code calls
  // these to align sequences, but for in-memory verification we don't care
  // about sequence alignment — make them no-ops so the seed runs.
  dbInstance.public.registerFunction({
    name: 'pg_get_serial_sequence',
    args: ['text', 'text'],
    returns: 'text',
    implementation: (_table, _col) => 'noop_sequence',
  });
  dbInstance.public.registerFunction({
    name: 'setval',
    args: ['text', 'bigint', 'boolean'],
    returns: 'bigint',
    implementation: (_seq, val) => Number(val) || 0,
  });
  dbInstance.public.registerFunction({
    name: 'now',
    args: [],
    returns: 'timestamptz',
    implementation: () => new Date(),
    impure: true,
  });

  const { Client } = dbInstance.adapters.createPg();
  pgClient = new Client();
  return dbInstance;
}

async function ensureClient() {
  ensureDb();
  if (!pgClient.__connected) {
    await pgClient.connect();
    pgClient.__connected = true;
  }
  return pgClient;
}

// Convert tagged-template (strings, ...values) to a parameterized pg query.
function buildQuery(strings, values) {
  let text = '';
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) text += '$' + (i + 1);
  }
  return { text, values };
}

async function runQuery(strings, values) {
  const client = await ensureClient();
  const { text, values: params } = buildQuery(strings, values);
  // pg-mem doesn't fully support every Postgres operator; if it throws we
  // surface the error so test output stays useful.
  const result = await client.query(text, params);
  return result.rows;
}

// Build a tagged-template function plus the .transaction() method that
// the admin endpoint relies on.
export function neon(_url) {
  const sql = (strings, ...values) => runQuery(strings, values);
  sql.transaction = async (queries) => {
    const client = await ensureClient();
    await client.query('BEGIN');
    try {
      const out = [];
      for (const q of queries) {
        // Each entry is the same Promise we'd return from the tagged template
        // — already in flight. pg-mem runs serially on the single client so
        // awaiting them inside the transaction is fine.
        out.push(await q);
      }
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    }
  };
  return sql;
}
