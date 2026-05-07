import { AuthResponseDto } from '../models/api.types';

export const ACCESS_TOKEN_KEY = 'bookvault_access';
export const REFRESH_TOKEN_KEY = 'bookvault_refresh';

/** Après un refresh réussi (intercepteur ou AuthService), pour aligner currentUser$. */
export const AUTH_TOKENS_REFRESHED_EVENT = 'bookvault-auth-tokens-refreshed';

export function readAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function readRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function activeTokenStorage(): Storage {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY) ? sessionStorage : localStorage;
}

/** Après POST /auth/refresh — conserve le même storage que la session courante. */
export function storeAuthResponse(res: AuthResponseDto): void {
  const store = activeTokenStorage();
  const other = store === localStorage ? sessionStorage : localStorage;
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  store.setItem(ACCESS_TOKEN_KEY, res.accessToken);
  store.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
}

export function storeTokensAfterLogin(res: AuthResponseDto, rememberMe: boolean): void {
  const store = rememberMe ? localStorage : sessionStorage;
  const other = store === localStorage ? sessionStorage : localStorage;
  other.removeItem(ACCESS_TOKEN_KEY);
  other.removeItem(REFRESH_TOKEN_KEY);
  store.setItem(ACCESS_TOKEN_KEY, res.accessToken);
  store.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
}

export function clearAllTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
