/** Pull access token from various backend response shapes. */
export function extractAccessToken(payload: unknown): string | null {
  if (payload == null) return null;
  if (typeof payload === 'string' && payload.length > 8) return payload;

  if (typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;

  const directKeys = ['access_token', 'accessToken', 'token', 'jwt', 'authToken', 'bearerToken'];
  for (const k of directKeys) {
    const v = o[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }

  if ('data' in o) {
    const nested = extractAccessToken(o.data);
    if (nested) return nested;
  }

  if ('tokens' in o && typeof o.tokens === 'object' && o.tokens) {
    const nested = extractAccessToken(o.tokens);
    if (nested) return nested;
  }

  return null;
}
