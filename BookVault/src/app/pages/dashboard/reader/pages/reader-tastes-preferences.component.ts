import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

const STORAGE_KEY = 'bv_reader_tastes_v1';

export interface ReaderTastesSnapshot {
  genres: string[];
  languages: string[];
  curiosity: number;
  rhythm: 'gourmand' | 'equilibre' | 'collectionneur';
  openTranslations: boolean;
  notes: string;
  updatedAt: string | null;
}

export interface CuriosityLink {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  accent: 'bordeaux' | 'foret' | 'indigo' | 'ambre' | 'ardoise';
  icon: string;
}

@Component({
  standalone: true,
  selector: 'app-reader-tastes-preferences',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reader-tastes-preferences.component.html',
})
export class ReaderTastesPreferencesComponent implements OnInit {
  /** Grille de genres : stockage par id (pas de lien catalogue pour l’instant). */
  readonly genreOptions = [
    { id: 'litterature', label: 'Littérature générale' },
    { id: 'sf', label: 'Science-fiction & anticipation' },
    { id: 'fantasy', label: 'Fantasy & merveilleux' },
    { id: 'polar', label: 'Polar & thriller' },
    { id: 'essai', label: 'Essais & idées' },
    { id: 'poésie', label: 'Poésie' },
    { id: 'bd', label: 'BD & graphique' },
    { id: 'jeunesse', label: 'Jeunesse' },
    { id: 'non_fr', label: 'Voix du monde (traduction)' },
  ] as const;

  readonly languageOptions = [
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'Anglais' },
    { id: 'es', label: 'Espagnol' },
    { id: 'de', label: 'Allemand' },
    { id: 'creoles', label: 'Créoles & langues régionales' },
    { id: 'autre', label: 'Autres langues' },
  ] as const;

  readonly rhythmOptions = [
    { id: 'gourmand' as const, label: 'Gourmand·e — peu de titres, mais profondément' },
    { id: 'equilibre' as const, label: 'Équilibre — variété et régularité' },
    { id: 'collectionneur' as const, label: 'Collectionneur·se — j’explore beaucoup de couvertures' },
  ];

  /** Cartographie de liens externes — chaque carte mène ailleurs, par intention. */
  readonly wonders: CuriosityLink[] = [
    {
      id: 'gallica',
      title: 'Gallica',
      subtitle: 'Millions de manuscrits, journaux et images patrimoniales de la BnF.',
      href: 'https://gallica.bnf.fr/',
      accent: 'bordeaux',
      icon: 'fas fa-landmark',
    },
    {
      id: 'europeana',
      title: 'Europeana',
      subtitle: 'Portail européen du patrimoine culturel numérisé.',
      href: 'https://www.europeana.eu/',
      accent: 'indigo',
      icon: 'fas fa-globe-europe',
    },
    {
      id: 'gutenberg',
      title: 'Project Gutenberg',
      subtitle: 'Classiques du domaine public, à lire et à partager librement.',
      href: 'https://www.gutenberg.org/',
      accent: 'ardoise',
      icon: 'fas fa-book-open',
    },
    {
      id: 'openlibrary',
      title: 'Open Library',
      subtitle: 'Catalogue ouvert pour explorer éditions, auteurs et emprunts numériques.',
      href: 'https://openlibrary.org/',
      accent: 'foret',
      icon: 'fas fa-database',
    },
    {
      id: 'standardebooks',
      title: 'Standard Ebooks',
      subtitle: 'Éditions soignées de textes libre de droit, propres et typographiques.',
      href: 'https://standardebooks.org/',
      accent: 'ambre',
      icon: 'fas fa-feather-pointed',
    },
    {
      id: 'librivox',
      title: 'LibriVox',
      subtitle: 'Livres audio du domaine public, enregistrés par des bénévoles du monde entier.',
      href: 'https://librivox.org/',
      accent: 'indigo',
      icon: 'fas fa-headphones',
    },
    {
      id: 'cnrtl',
      title: 'CNRTL',
      subtitle: 'Ressources lexicales et étymologiques pour affiner votre rapport aux mots.',
      href: 'https://www.cnrtl.fr/',
      accent: 'bordeaux',
      icon: 'fas fa-spell-check',
    },
    {
      id: 'lumni',
      title: 'Lumni',
      subtitle: 'Magazines, documentaires et parcours pour prolonger une curiosité sans fin.',
      href: 'https://www.lumni.fr/',
      accent: 'foret',
      icon: 'fas fa-tv',
    },
  ];

  draft: ReaderTastesSnapshot = {
    genres: [],
    languages: ['fr'],
    curiosity: 3,
    rhythm: 'equilibre',
    openTranslations: true,
    notes: '',
    updatedAt: null,
  };

  savedFlash = false;
  randomLine: string | null = null;

  ngOnInit(): void {
    this.hydrateFromStorage();
  }

  toggleGenre(id: string): void {
    const set = new Set(this.draft.genres);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.draft.genres = [...set];
  }

  toggleLanguage(id: string): void {
    const set = new Set(this.draft.languages);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.draft.languages = [...set];
    if (!this.draft.languages.length) {
      this.draft.languages = ['fr'];
    }
  }

  isGenre(id: string): boolean {
    return this.draft.genres.includes(id);
  }

  isLang(id: string): boolean {
    return this.draft.languages.includes(id);
  }

  save(): void {
    try {
      const payload: ReaderTastesSnapshot = {
        ...this.draft,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      this.draft = payload;
      this.savedFlash = true;
      setTimeout(() => (this.savedFlash = false), 2600);
    } catch {
      /* ignore quota */
    }
  }

  resetLocal(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.draft = {
      genres: [],
      languages: ['fr'],
      curiosity: 3,
      rhythm: 'equilibre',
      openTranslations: true,
      notes: '',
      updatedAt: null,
    };
    this.randomLine = 'Palette remise à zéro — à vous de la repeindre.';
    setTimeout(() => (this.randomLine = null), 3200);
  }

  surpriseMe(): void {
    const pool = this.wonders;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.randomLine = `Direction : ${pick.title} — bon voyage.`;
    window.open(pick.href, '_blank', 'noopener,noreferrer');
    setTimeout(() => (this.randomLine = null), 4000);
  }

  accentCardClasses(accent: CuriosityLink['accent']): string {
    const map: Record<CuriosityLink['accent'], string> = {
      bordeaux:
        'border-rose-900/25 dark:border-rose-400/20 bg-gradient-to-br from-rose-50/90 to-amber-50/50 dark:from-rose-950/40 dark:to-[#1c1412]',
      foret:
        'border-emerald-900/20 dark:border-emerald-400/15 bg-gradient-to-br from-emerald-50/80 to-stone-50 dark:from-emerald-950/35 dark:to-[#141816]',
      indigo:
        'border-indigo-900/20 dark:border-indigo-400/20 bg-gradient-to-br from-indigo-50/85 to-violet-50/40 dark:from-indigo-950/40 dark:to-[#16121c]',
      ambre:
        'border-amber-900/25 dark:border-amber-400/20 bg-gradient-to-br from-amber-50/90 to-orange-50/40 dark:from-amber-950/30 dark:to-[#1c160f]',
      ardoise:
        'border-slate-700/25 dark:border-slate-500/20 bg-gradient-to-br from-slate-100/90 to-zinc-50 dark:from-slate-900/50 dark:to-[#121418]',
    };
    return map[accent];
  }

  private hydrateFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const o = JSON.parse(raw) as Partial<ReaderTastesSnapshot>;
      if (!o || typeof o !== 'object') return;
      this.draft = {
        genres: Array.isArray(o.genres) ? o.genres.filter((g): g is string => typeof g === 'string') : [],
        languages: Array.isArray(o.languages) && o.languages.length
          ? o.languages.filter((g): g is string => typeof g === 'string')
          : ['fr'],
        curiosity: typeof o.curiosity === 'number' ? Math.min(5, Math.max(1, Math.round(o.curiosity))) : 3,
        rhythm:
          o.rhythm === 'gourmand' || o.rhythm === 'collectionneur' || o.rhythm === 'equilibre'
            ? o.rhythm
            : 'equilibre',
        openTranslations: typeof o.openTranslations === 'boolean' ? o.openTranslations : true,
        notes: typeof o.notes === 'string' ? o.notes : '',
        updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : null,
      };
    } catch {
      /* ignore */
    }
  }
}
