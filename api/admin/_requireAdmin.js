import { getSessionTokenFromRequest, verifyAdminSession } from './_auth.js';

export async function requireAdmin(req) {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  try {
    return await verifyAdminSession(token);
  } catch (e) {
    return null;
  }
}

