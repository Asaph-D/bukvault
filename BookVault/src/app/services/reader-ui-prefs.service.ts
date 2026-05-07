import { Injectable } from '@angular/core';
import { ReaderSettingsDto } from '../models/api.types';

/**
 * Applique sur le document les préférences lecteur (densité, mouvement, clés pour autres écrans).
 * Complète ThemeService pour le thème clair/sombre.
 */
@Injectable({ providedIn: 'root' })
export class ReaderUiPrefsService {
  applyFromDto(s: ReaderSettingsDto): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-density', s.uiDensity === 'COMPACT' ? 'compact' : 'comfortable');
    root.classList.toggle('bv-reduce-motion', s.reduceMotion);
    try {
      sessionStorage.setItem('bv_reader_home_default', s.readerHomeDefault);
      sessionStorage.setItem('bv_community_visibility', s.communityVisibility);
      sessionStorage.setItem('bv_allow_dm', String(s.allowDirectMessages));
      sessionStorage.setItem('bv_library_show_progress', String(s.libraryShowProgress));
    } catch {
      /* ignore */
    }
  }

  resetDocumentHints(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.removeAttribute('data-density');
    root.classList.remove('bv-reduce-motion');
    try {
      sessionStorage.removeItem('bv_reader_home_default');
      sessionStorage.removeItem('bv_community_visibility');
      sessionStorage.removeItem('bv_allow_dm');
      sessionStorage.removeItem('bv_library_show_progress');
    } catch {
      /* ignore */
    }
  }
}
