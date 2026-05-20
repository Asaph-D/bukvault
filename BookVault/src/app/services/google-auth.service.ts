import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { type?: string; theme?: string; size?: string; width?: number },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

/** Google Identity Services — obtention d’un id_token pour l’API auth-service. */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly hostId = 'bv-google-signin-host';
  private loadPromise: Promise<void> | null = null;

  isAvailable(): boolean {
    return !!environment.googleClientId?.trim();
  }

  /** Ouvre le flux Google et renvoie le JWT id_token. */
  requestIdToken(): Promise<string> {
    const clientId = environment.googleClientId?.trim();
    if (!clientId) {
      return Promise.reject(
        new Error('Connexion Google non configurée (googleClientId manquant dans environment).'),
      );
    }
    return this.ensureScript().then(
      () =>
        new Promise<string>((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            reject(new Error('Connexion Google annulée ou expirée.'));
          }, 120_000);

          const finish = (token: string | null, err?: Error) => {
            window.clearTimeout(timeout);
            this.cleanupHost();
            if (token) {
              resolve(token);
            } else {
              reject(err ?? new Error('Connexion Google annulée.'));
            }
          };

          const host = this.getOrCreateHost();
          host.innerHTML = '';

          window.google!.accounts.id.initialize({
            client_id: clientId,
            auto_select: false,
            callback: (resp) => finish(resp?.credential ?? null),
          });

          window.google!.accounts.id.renderButton(host, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
          });

          window.setTimeout(() => {
            const btn = host.querySelector('[role="button"]') ?? host.querySelector('div');
            if (btn instanceof HTMLElement) {
              btn.click();
            } else {
              finish(null, new Error('Impossible d’ouvrir la fenêtre Google.'));
            }
          }, 150);
        }),
    );
  }

  private ensureScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }
    this.loadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Script Google introuvable.')), {
          once: true,
        });
        if (window.google?.accounts?.id) {
          resolve();
        }
        return;
      }
      reject(new Error('Script Google Identity Services non chargé.'));
    });
    return this.loadPromise;
  }

  private getOrCreateHost(): HTMLElement {
    let host = document.getElementById(this.hostId);
    if (!host) {
      host = document.createElement('div');
      host.id = this.hostId;
      host.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:auto;';
      document.body.appendChild(host);
    }
    return host;
  }

  private cleanupHost(): void {
    const host = document.getElementById(this.hostId);
    if (host) {
      host.innerHTML = '';
    }
  }
}
