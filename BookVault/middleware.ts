/**
 * Proxy Vercel → ngrok pour les fichiers publics (couvertures, avatars).
 * Ajoute `ngrok-skip-browser-warning` côté serveur : les balises `<img>` ne peuvent pas l’envoyer.
 *
 * Variable Vercel : NGROK_GATEWAY_URL (ex. https://xxx.ngrok-free.dev)
 */
const NGROK_ORIGIN =
  process.env['NGROK_GATEWAY_URL'] ?? 'https://dayana-unfended-will.ngrok-free.dev';

export const config = {
  matcher: '/api/v1/files/:path*',
};

export default async function middleware(request: Request): Promise<Response> {
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, NGROK_ORIGIN);

  const headers = new Headers(request.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.delete('host');

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  const upstream = await fetch(target.toString(), init);
  const responseHeaders = new Headers(upstream.headers);

  if (incoming.pathname.includes('/cover/') || incoming.pathname.includes('/avatar/')) {
    responseHeaders.set('Cache-Control', 'public, max-age=300');
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}
