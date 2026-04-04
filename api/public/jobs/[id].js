import { forwardGetJson } from '../../_jobsProxy.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const id = req.query?.id;
    if (id === undefined || id === null || String(id).trim() === '') {
      res.status(400).json({ error: 'Missing job id' });
      return;
    }

    const { status, body } = await forwardGetJson(`/jobs/${encodeURIComponent(String(id))}`);
    res.status(status).json(body);
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Job API proxy failed' });
  }
}
