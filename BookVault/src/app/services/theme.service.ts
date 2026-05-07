import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeId = 'light' | 'dark';

const STORAGE_KEY = 'bookvault-theme';
/** Préférence persistée côté API (LIGHT / DARK / SYSTEM). */
const API_PREF_KEY = 'bookvault-theme-api-preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly subject = new BehaviorSubject<ThemeId>('light');
  readonly theme$ = this.subject.asObservable();

  constructor() {
    this.syncFromPreference();
  }

  private readInitial(): ThemeId {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private syncFromPreference(): void {
    const theme = this.readInitial();
    this.subject.next(theme);
    this.applyDom(theme);
  }

  private applyDom(theme: ThemeId): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  get theme(): ThemeId {
    return this.subject.value;
  }

  get isDark(): boolean {
    return this.subject.value === 'dark';
  }

  setTheme(theme: ThemeId): void {
    if (this.subject.value === theme) {
      return;
    }
    this.subject.next(theme);
    this.applyDom(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  toggle(): void {
    this.setTheme(this.subject.value === 'dark' ? 'light' : 'dark');
  }

  /**
   * Applique la valeur stockée en base (reader-settings).
   * SYSTEM suit prefers-color-scheme au moment de l’appel (pas d’écoute temps réel OS).
   */
  applyReaderApiPreference(pref: 'LIGHT' | 'DARK' | 'SYSTEM'): void {
    try {
      localStorage.setItem(API_PREF_KEY, pref);
    } catch {
      /* ignore */
    }
    if (pref === 'SYSTEM') {
      const dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(dark ? 'dark' : 'light');
      return;
    }
    this.setTheme(pref === 'DARK' ? 'dark' : 'light');
  }
}
