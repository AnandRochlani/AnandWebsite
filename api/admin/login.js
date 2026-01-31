import { buildSessionCookie, isSecureRequest, signAdminSession } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return res.status(500).json({ error: 'Admin credentials are not configured' });
  }

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (username !== expectedUser || password !== expectedPass) {
    // Don’t leak which field was wrong
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const token = await signAdminSession({ username });
    const secure = isSecureRequest(req);

    res.setHeader('Set-Cookie', buildSessionCookie({ token, secure }));
    return res.status(200).json({ ok: true, user: { username } });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create session' });
  }
}

