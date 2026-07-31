import { getSessionTokenFromRequest, verifyAdminSession } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = getSessionTokenFromRequest(req);
  if (!token) {
    // Return 200 to avoid noisy console 401s; client treats as logged out.
    return res.status(200).json({ authenticated: false });
  }

  try {
    const user = await verifyAdminSession(token);
    return res.status(200).json({ authenticated: true, user });
  } catch (e) {
    return res.status(200).json({ authenticated: false });
  }
}

