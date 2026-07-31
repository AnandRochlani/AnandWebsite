import { forwardJson } from '../../_jobsProxy.js';
import { requireAdmin } from '../_requireAdmin.js';

export default async function handler(req, res) {
  const user = await requireAdmin(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const id = req.query?.id;
  if (id === undefined || id === null || String(id).trim() === '') {
    res.status(400).json({ error: 'Missing job id' });
    return;
  }

  try {
    const { status, body } = await forwardJson(
      'DELETE',
      `/jobs/${encodeURIComponent(String(id))}`
    );
    res.status(status).json(body ?? { success: true });
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Job API proxy failed' });
  }
}
