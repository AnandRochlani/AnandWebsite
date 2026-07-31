import { buildClearCookie, isSecureRequest } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secure = isSecureRequest(req);
  res.setHeader('Set-Cookie', buildClearCookie({ secure }));
  return res.status(200).json({ ok: true });
}

