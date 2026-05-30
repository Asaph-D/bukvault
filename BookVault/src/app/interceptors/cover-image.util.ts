import { isNgrokHost } from './ngrok-http.util';

/**
 * URL affichable dans une balise `<img>`.
 * En prod (API via ngrok), utilise un chemin same-origin `/api/v1/...` proxifié par Vercel
 * car le navigateur ne peut pas envoyer `ngrok-skip-browser-warning` sur les images.
 */
export function resolveCoverImageUrl(
  coverUrl: string | null | undefined,
  bookId: string,
  apiBase: string,
): string {
  const base = apiBase.replace(/\/$/, '');
  const fallback = isNgrokHost(base)
    ? `/api/v1/files/cover/${bookId}`
    : `${base}/files/cover/${bookId}`;

  if (!coverUrl?.trim()) {
    return fallback;
  }

  const raw = coverUrl.trim();
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (isNgrokHost(raw)) {
      try {
        return new URL(raw).pathname;
      } catch {
        return fallback;
      }
    }
    return raw;
  }

  return raw.startsWith('/') ? raw : `/${raw}`;
}
