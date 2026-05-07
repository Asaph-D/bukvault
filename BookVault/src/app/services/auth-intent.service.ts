import { Injectable } from '@angular/core';

export type AuthIntent = {
  /** URL à restaurer après login (ex: /books/123?tab=...) */
  returnUrl: string;
  /** Optionnel: action/metadata (utile plus tard) */
  action?: string;
  createdAt: number;
};

const KEY = 'bookvault_auth_intent';

@Injectable({ providedIn: 'root' })
export class AuthIntentService {
  save(returnUrl: string, action?: string): void {
    const intent: AuthIntent = { returnUrl, action, createdAt: Date.now() };
    try {
      sessionStorage.setItem(KEY, JSON.stringify(intent));
    } catch {
      /* ignore */
    }
  }

  peek(): AuthIntent | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthIntent;
    } catch {
      return null;
    }
  }

  consume(): AuthIntent | null {
    const v = this.peek();
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return v;
  }

  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }
}

