import { ensureSchemaAndSeed, toSiteSettingDto } from '../_db.js';
import { requireAdmin } from './_requireAdmin.js';
import {
  MAX_VALUE_BYTES,
  validateValueForType,
  validateKeyValue,
  payloadByteLength,
} from '../_settingsValidators.js';

function sanitizeErrorMessage(message) {
  if (!message) return 'Server error';
  return String(message).replace(/postgres(ql)?:\/\/[^@\s]+@/gi, 'postgres://***@');
}

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const sql = await ensureSchemaAndSeed();

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT key, value, category, type, label, description, sort_order, updated_at
        FROM site_settings
        ORDER BY category ASC, sort_order ASC, key ASC;
      `;
      res.status(200).json({ settings: rows.map(toSiteSettingDto) });
      return;
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const updates = Array.isArray(body.updates) ? body.updates : [];
      if (updates.length === 0) {
        res.status(400).json({ error: 'No updates provided' });
        return;
      }
      if (updates.length > 200) {
        res.status(400).json({ error: 'Too many updates in one request' });
        return;
      }

      // Load existing rows once so we can validate against their declared `type`.
      const existing = await sql`SELECT key, type FROM site_settings;`;
      const typeByKey = new Map(existing.map((r) => [r.key, r.type]));

      // Validate everything BEFORE writing anything. Atomic.
      for (const u of updates) {
        if (!u || typeof u.key !== 'string' || !u.key) {
          res.status(400).json({ error: 'Each update needs a string `key`' });
          return;
        }
        if (!typeByKey.has(u.key)) {
          res.status(400).json({ error: `Unknown setting key: ${u.key}` });
          return;
        }
        if (payloadByteLength(u.value) > MAX_VALUE_BYTES) {
          res.status(413).json({ error: `Value for "${u.key}" exceeds ${MAX_VALUE_BYTES} bytes` });
          return;
        }
        const typeErr = validateValueForType(u.value, typeByKey.get(u.key));
        if (typeErr) {
          res.status(400).json({ error: `${u.key}: ${typeErr}` });
          return;
        }
        const keyErr = validateKeyValue(u.key, u.value);
        if (keyErr) {
          res.status(400).json({ error: `${u.key}: ${keyErr}` });
          return;
        }
      }

      // Transactional batch write. Neon's HTTP driver supports an atomic
      // array form for sql.transaction(). Either everything commits or
      // nothing does.
      const queries = updates.map(
        (u) => sql`
          UPDATE site_settings
          SET value = ${u.value === undefined ? null : JSON.stringify(u.value)},
              updated_at = NOW()
          WHERE key = ${u.key};
        `
      );
      if (typeof sql.transaction === 'function') {
        await sql.transaction(queries);
      } else {
        // Fallback for drivers without batch transaction support — best
        // effort but not atomic. Should not be hit in production (Neon).
        for (const q of queries) await q;
      }

      const rows = await sql`
        SELECT key, value, category, type, label, description, sort_order, updated_at
        FROM site_settings
        ORDER BY category ASC, sort_order ASC, key ASC;
      `;
      res.status(200).json({ success: true, settings: rows.map(toSiteSettingDto) });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.key || typeof body.key !== 'string') {
        res.status(400).json({ error: 'Missing key' });
        return;
      }
      const type = body.type || 'text';
      if (payloadByteLength(body.value) > MAX_VALUE_BYTES) {
        res.status(413).json({ error: `Value exceeds ${MAX_VALUE_BYTES} bytes` });
        return;
      }
      const typeErr = validateValueForType(body.value, type);
      if (typeErr) {
        res.status(400).json({ error: typeErr });
        return;
      }
      const keyErr = validateKeyValue(body.key, body.value);
      if (keyErr) {
        res.status(400).json({ error: keyErr });
        return;
      }

      const valueJson = body.value === undefined ? null : JSON.stringify(body.value);
      const rows = await sql`
        INSERT INTO site_settings (key, value, category, type, label, description, sort_order)
        VALUES (
          ${body.key},
          ${valueJson},
          ${body.category || 'general'},
          ${type},
          ${body.label || null},
          ${body.description || null},
          ${typeof body.sortOrder === 'number' ? body.sortOrder : 0}
        )
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          category = EXCLUDED.category,
          type = EXCLUDED.type,
          label = EXCLUDED.label,
          description = EXCLUDED.description,
          sort_order = EXCLUDED.sort_order,
          updated_at = NOW()
        RETURNING key, value, category, type, label, description, sort_order, updated_at;
      `;
      res.status(200).json({ success: true, setting: toSiteSettingDto(rows?.[0] || null) });
      return;
    }

    if (req.method === 'DELETE') {
      const key = req?.query?.key;
      if (!key) {
        res.status(400).json({ error: 'Missing key' });
        return;
      }
      await sql`DELETE FROM site_settings WHERE key = ${String(key)};`;
      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    res.status(500).json({ error: sanitizeErrorMessage(e?.message) });
  }
}
