import { forwardJson } from '../_jobsProxy.js';
import { requireAdmin } from './_requireAdmin.js';

function normalizeSkills(value) {
  if (Array.isArray(value)) {
    return value.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = req.body || {};

    if (!body.title || !String(body.title).trim()) {
      res.status(400).json({ error: 'Job title is required' });
      return;
    }
    if (!body.company_name || !String(body.company_name).trim()) {
      res.status(400).json({ error: 'Company name is required' });
      return;
    }

    const payload = {
      title: String(body.title).trim(),
      company_name: String(body.company_name).trim(),
      company_id: body.company_id ?? null,
      location: body.location ? String(body.location).trim() : null,
      description: body.description ? String(body.description) : null,
      raw_description: body.raw_description ? String(body.raw_description) : null,
      apply_url: body.apply_url ? String(body.apply_url).trim() : null,
      min_experience: toNumberOrNull(body.min_experience ?? body.min_exp),
      max_experience: toNumberOrNull(body.max_experience ?? body.max_exp),
      skills: normalizeSkills(body.skills),
    };

    const { status, body: upstream } = await forwardJson('POST', '/jobs', payload);
    res.status(status).json(upstream);
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Job API proxy failed' });
  }
}
