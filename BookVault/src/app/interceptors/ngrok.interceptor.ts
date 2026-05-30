import { HttpInterceptorFn } from '@angular/common/http';
import { isNgrokHost, NGROK_SKIP_HEADER } from './ngrok-http.util';

/** Contourne l’interstitiel ngrok pour les appels cross-origin depuis Vercel. */
export const ngrokInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isNgrokHost(req.url)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { [NGROK_SKIP_HEADER]: 'true' } }));
};
