import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'admin_session';

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error('Missing env var ADMIN_JWT_SECRET');
  }
  return new TextEncoder().encode(secret);
}

export function parseCookies(cookieHeader = '') {
  const out = {};
  cookieHeader.split(';').forEach((part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return;
    out[rawKey] = decodeURIComponent(rest.join('=') || '');
  });
  return out;
}

export function isSecureRequest(req) {
  // Vercel sets x-forwarded-proto=https in production
  const proto = req?.headers?.['x-forwarded-proto'];
  if (proto) return proto === 'https';
  return process.env.VERCEL === '1';
}

export async function signAdminSession({ username }) {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);
  const sevenDays = 60 * 60 * 24 * 7;

  return await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + sevenDays)
    .sign(secret);
}

export async function verifyAdminSession(token) {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  if (!payload?.username) throw new Error('Invalid session');
  return { username: String(payload.username) };
}

export function buildSessionCookie({ token, secure }) {
  // 7 days
  const maxAge = 60 * 60 * 24 * 7;
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function buildClearCookie({ secure }) {
  const attrs = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  if (secure) attrs.push('Secure');
  return attrs.join('; ');
}

export function getSessionTokenFromRequest(req) {
  const cookies = parseCookies(req?.headers?.cookie || '');
  return cookies[COOKIE_NAME];
}

