import {
  HttpBackend,
  HttpClient,
  HttpEvent,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  clearAllTokens,
  readAccessToken,
  readRefreshToken,
  REFRESH_TOKEN_KEY,
} from '../services/auth-token.store';
import { AUTH_TOKENS_PURGED_EVENT } from '../services/auth.service';
import { AuthRefreshCoordinator } from '../services/auth-refresh.coordinator';

/** Connexion publique / refresh / logout : pas de Bearer automatique (logout envoie déjà le sien). */
const AUTH_SKIP_SUBSTRINGS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const jwtHelper = new JwtHelperService();

/** Considérer le JWT comme expiré un peu avant l’heure réelle pour éviter les 401 en course. */
const ACCESS_EXPIRY_MARGIN_SEC = 60;

function purgeAndNotify(reason: 'expired' | 'unauthorized'): void {
  if (typeof window === 'undefined') {
    clearAllTokens();
    return;
  }
  const refresh =
    localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  clearAllTokens();
  window.dispatchEvent(
    new CustomEvent(AUTH_TOKENS_PURGED_EVENT, {
      detail: { reason, refreshToken: refresh || null },
    })
  );
}

function resolveAccessToken(
  httpPlain: HttpClient,
  coordinator: AuthRefreshCoordinator
): Observable<string | null> {
  const access = readAccessToken();
  const refresh = readRefreshToken();

  const accessExpired =
    !access || jwtHelper.isTokenExpired(access, ACCESS_EXPIRY_MARGIN_SEC);

  if (!accessExpired && access) {
    return of(access);
  }

  if (refresh) {
    const refreshed: Observable<string | null> = coordinator.refreshWith(httpPlain).pipe(
      catchError((): Observable<string | null> => {
        purgeAndNotify('unauthorized');
        return of<string | null>(null);
      })
    );
    return refreshed;
  }

  if (access && accessExpired) {
    purgeAndNotify('expired');
  }

  return of<string | null>(null);
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const url = req.url;
  if (AUTH_SKIP_SUBSTRINGS.some(s => url.includes(s))) {
    return next(req);
  }

  const httpPlain = new HttpClient(inject(HttpBackend));
  const coordinator = inject(AuthRefreshCoordinator);

  return resolveAccessToken(httpPlain, coordinator).pipe(
    switchMap((token: string | null): Observable<HttpEvent<unknown>> => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq).pipe(
        catchError((err: unknown): Observable<HttpEvent<unknown>> => {
          const status = (err as { status?: number })?.status;

          // Sans Bearer : 401 attendu pour les appels non authentifiés — ne pas purger.
          if (status !== 401 || token == null || token === '') {
            return throwError(() => err);
          }

          return coordinator.refreshWith(httpPlain).pipe(
            switchMap((newAccess: string): Observable<HttpEvent<unknown>> => {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${newAccess}` },
              });
              return next(retryReq).pipe(
                catchError((err2: unknown): Observable<HttpEvent<unknown>> => {
                  if ((err2 as { status?: number })?.status === 401) {
                    purgeAndNotify('unauthorized');
                  }
                  return throwError(() => err2);
                })
              );
            }),
            catchError((): Observable<HttpEvent<unknown>> => {
              purgeAndNotify('unauthorized');
              return throwError(() => err);
            })
          );
        })
      );
    })
  );
};
