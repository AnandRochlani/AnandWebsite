import { forwardGetJson, vercelQueryToString } from '../../_jobsProxy.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const qs = vercelQueryToString(req.query);
    const { status, body } = await forwardGetJson('/jobs', qs);
    res.status(status).json(body);
  } catch (e) {
    res.status(502).json({ error: e?.message || 'Job API proxy failed' });
  }
}
