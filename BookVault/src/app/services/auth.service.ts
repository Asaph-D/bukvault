import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponseDto, UserResponseDto } from '../models/api.types';
import { User } from '../models/user.model';
import {
    ACCESS_TOKEN_KEY,
    AUTH_TOKENS_REFRESHED_EVENT,
    REFRESH_TOKEN_KEY,
    clearAllTokens,
    readAccessToken,
    readRefreshToken,
    storeAuthResponse,
    storeTokensAfterLogin,
} from './auth-token.store';
import {
    AUTH_SESSION_EXPIRED_UI_EVENT,
    AUTH_SESSION_RESTORED_UI_EVENT,
} from './auth-ui.events';

/** Ré-export pour les imports existants (`auth.interceptor`, etc.). */
export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './auth-token.store';

/** Émis par l’intercepteur HTTP si les jetons sont retirés (sync. avec currentUser$). */
export const AUTH_TOKENS_PURGED_EVENT = 'bookvault-auth-tokens-purged';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private jwtHelper = new JwtHelperService();
  private readonly apiBase = environment.apiUrl;
  /** Requêtes auth sans repasser par l’intercepteur (évite dépendances circulaires au bootstrap). */
  private readonly httpPlain: HttpClient;

  constructor(
    private http: HttpClient,
    httpBackend: HttpBackend
  ) {
    this.httpPlain = new HttpClient(httpBackend);
    this.restoreSession();
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_TOKENS_PURGED_EVENT, (ev: Event) => {
        const e = ev as CustomEvent<{ reason?: string; refreshToken?: string | null }>;
        const refresh =
          e?.detail?.refreshToken ||
          localStorage.getItem(REFRESH_TOKEN_KEY) ||
          sessionStorage.getItem(REFRESH_TOKEN_KEY);

        if (refresh) {
          this.httpPlain
            .post(`${this.apiBase}/auth/logout`, { refreshToken: refresh })
            .subscribe({
              complete: () => this.clearLocalSession(),
              error: () => this.clearLocalSession(),
            });
        } else {
          this.clearLocalSession();
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_UI_EVENT));
        }
      });

      window.addEventListener(AUTH_TOKENS_REFRESHED_EVENT, (ev: Event) => {
        const e = ev as CustomEvent<AuthResponseDto>;
        const u = e?.detail?.user;
        if (u) {
          this.currentUserSubject.next(this.mapUser(u));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AUTH_SESSION_RESTORED_UI_EVENT));
          }
        }
      });
    }
  }

  private hydrateMinimalUserFromAccessToken(access: string): void {
    try {
      const decoded = this.jwtHelper.decodeToken(access) as {
        sub?: string;
        email?: string;
        role?: string;
        firstName?: string;
        lastName?: string;
      };
      const id = decoded?.sub || '';
      const role = (decoded?.role || 'USER').toLowerCase() as User['role'];
      const firstName = decoded?.firstName || '';
      const lastName = decoded?.lastName || '';
      if (id) {
        this.currentUserSubject.next({
          id,
          firstName,
          lastName,
          email: decoded?.email || '',
          initials: `${(firstName || '?').charAt(0)}${(lastName || '?').charAt(0)}`.toUpperCase(),
          role,
          memberSince: new Date()
        });
      }
    } catch {
      /* ignore */
    }
  }

  private restoreSession(): void {
    const access = readAccessToken();
    const refresh = readRefreshToken();
    const accessExpired = !access || this.jwtHelper.isTokenExpired(access);

    if (!refresh && accessExpired) {
      this.clearLocalSession();
      return;
    }

    if (refresh && accessExpired) {
      this.httpPlain
        .post<AuthResponseDto>(`${this.apiBase}/auth/refresh`, { refreshToken: refresh })
        .pipe(
          tap(res => storeAuthResponse(res)),
          tap(() => {
            const t = readAccessToken();
            if (t) this.hydrateMinimalUserFromAccessToken(t);
          }),
          switchMap(() => this.http.get<UserResponseDto>(`${this.apiBase}/auth/me`)),
          catchError(() => {
            this.clearLocalSession();
            return EMPTY;
          })
        )
        .subscribe(u => this.currentUserSubject.next(this.mapUser(u)));
      return;
    }

    if (access) {
      this.hydrateMinimalUserFromAccessToken(access);
    }

    this.http.get<UserResponseDto>(`${this.apiBase}/auth/me`).subscribe({
      next: u => this.currentUserSubject.next(this.mapUser(u)),
      error: () => this.clearLocalSession()
    });
  }

  private mapUser(u: UserResponseDto): User {
    return {
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      initials: `${(u.firstName || '?').charAt(0)}${(u.lastName || '?').charAt(0)}`.toUpperCase(),
      role: u.role.toLowerCase() as User['role'],
      memberSince: new Date(u.createdAt)
    };
  }

  private clearLocalSession(): void {
    clearAllTokens();
    this.currentUserSubject.next(null);
  }

  private mapHttpError(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object') {
      const msg = (body as { message?: string }).message;
      if (typeof msg === 'string') return msg;
    }
    if (typeof body === 'string' && body.length < 500) return body;
    if (err.status === 401) return 'Identifiants invalides.';
    if (err.status === 409) return 'Cette adresse e-mail est déjà utilisée.';
    return err.statusText || 'Une erreur est survenue.';
  }

  login(email: string, password: string, rememberMe = true): Observable<User> {
    return this.http
      .post<AuthResponseDto>(`${this.apiBase}/auth/login`, { email, password, rememberMe })
      .pipe(
        tap(res => {
          storeTokensAfterLogin(res, rememberMe);
          this.currentUserSubject.next(this.mapUser(res.user));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AUTH_SESSION_RESTORED_UI_EVENT));
          }
        }),
        map(res => this.mapUser(res.user)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.mapHttpError(err)))
        )
      );
  }

  register(user: Partial<User>, password: string, objective: 'USER' | 'AUTHOR'): Observable<User> {
    return this.http
      .post<AuthResponseDto>(`${this.apiBase}/auth/register`, {
        email: user.email,
        password,
        firstName: user.firstName,
        lastName: user.lastName,
        objective
      })
      .pipe(
        tap(res => {
          storeTokensAfterLogin(res, true);
          this.currentUserSubject.next(this.mapUser(res.user));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AUTH_SESSION_RESTORED_UI_EVENT));
          }
        }),
        map(res => this.mapUser(res.user)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.mapHttpError(err)))
        )
      );
  }

  googleLogin(): Observable<User> {
    return throwError(
      () => new Error('La connexion Google n’est pas encore disponible.')
    );
  }

  logout(): void {
    const refresh =
      localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    const access =
      localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    this.httpPlain
      .post(
        `${this.apiBase}/auth/logout`,
        { refreshToken: refresh },
        {
          headers: access ? { Authorization: `Bearer ${access}` } : {}
        }
      )
      .subscribe({
        complete: () => this.clearLocalSession(),
        error: () => this.clearLocalSession()
      });
  }

  /** Instantané (dernier état connu), utile pour les guards synchrones. */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const access = readAccessToken();
    const refresh = readRefreshToken();
    if (access && !this.jwtHelper.isTokenExpired(access)) return true;
    return !!refresh;
  }

  getToken(): string | null {
    return readAccessToken();
  }
}
