import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponseDto } from '../models/api.types';
import {
  readRefreshToken,
  storeAuthResponse,
  AUTH_TOKENS_REFRESHED_EVENT,
} from './auth-token.store';

/**
 * Un seul POST /auth/refresh à la fois (requêtes HTTP parallèles avec JWT expiré).
 */
@Injectable({ providedIn: 'root' })
export class AuthRefreshCoordinator {
  private inflight: Observable<string> | null = null;

  refreshWith(httpPlain: HttpClient): Observable<string> {
    if (this.inflight) {
      return this.inflight;
    }

    const refresh = readRefreshToken();
    if (!refresh) {
      return throwError(() => new Error('Pas de refresh token'));
    }

    this.inflight = httpPlain
      .post<AuthResponseDto>(`${environment.apiUrl}/auth/refresh`, { refreshToken: refresh })
      .pipe(
        tap(res => {
          storeAuthResponse(res);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AUTH_TOKENS_REFRESHED_EVENT, { detail: res }));
          }
        }),
        map(res => res.accessToken),
        catchError(err => {
          this.inflight = null;
          return throwError(() => err);
        }),
        finalize(() => {
          this.inflight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.inflight;
  }
}
