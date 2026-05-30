/** Évite la page d’avertissement ngrok (free) qui bloque CORS côté navigateur. */
export const NGROK_SKIP_HEADER = 'ngrok-skip-browser-warning';

export function isNgrokHost(url: string): boolean {
  return /ngrok-free\.(app|dev)|\.ngrok\.io/i.test(url);
}

export function withNgrokHeaders(
  url: string,
  headers: Record<string, string> = {},
): Record<string, string> {
  if (!isNgrokHost(url)) {
    return headers;
  }
  return { ...headers, [NGROK_SKIP_HEADER]: 'true' };
}
