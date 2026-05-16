import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { AuthService } from '../../../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-author-home',
  imports: [CommonModule, RouterModule],
  templateUrl: './author-home.component.html',
})
export class AuthorHomeComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private bookService: BookService,
  ) {}

  get displayName(): string {
    return this.auth.getCurrentUser()?.firstName || 'Auteur';
  }

  dataLoading = true;
  booksError: string | null = null;

  authorStats: { label: string; value: string; hint: string }[] = [
    { label: 'Œuvres publiées', value: '—', hint: 'Catalogue public' },
    { label: 'Vues (catalogue)', value: '—', hint: 'Cumul des lectures de fiche' },
    { label: 'Avis reçus', value: '—', hint: 'Sur vos titres' },
    { label: 'Prix moyen', value: '—', hint: 'Titre le plus récent' },
  ];

  currentProject: {
    title: string;
    blurb: string;
    progress: number;
    cover: string;
  } = {
    title: 'Chargement…',
    blurb: '',
    progress: 0,
    cover: PLACEHOLDER_COVER,
  };

  wordBars = [22, 28, 35, 40, 48, 55, 62, 58, 70, 78, 85, 92];

  challenges = [
    { icon: '🔥', title: 'Défi 30 jours d’écriture', detail: 'Jour 18 / 30 · objectif 500 mots' },
    { icon: '🏆', title: 'Lecteurs du mois', detail: 'Top 10 % des auteurs de votre genre' },
  ];

  quickTools: { icon: string; label: string; link: string }[] = [
    { icon: 'fas fa-book', label: 'Mes œuvres', link: '/dashboard/author/works' },
    { icon: 'fas fa-calendar-alt', label: 'Planning', link: '/dashboard/author/progress' },
    { icon: 'fas fa-database', label: 'Sauvegardes', link: '/dashboard/author/resources' },
    { icon: 'fas fa-file-export', label: 'Export', link: '/dashboard/author/works' },
    { icon: 'fas fa-users', label: 'Co-auteurs', link: '/dashboard/author/challenges' },
    { icon: 'fas fa-file-contract', label: 'Contrats', link: '/dashboard/author/messages' },
  ];

  activities: { icon: string; title: string; time: string }[] = [
    { icon: 'fas fa-star', title: 'Chargement de l’activité…', time: '—' },
  ];

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'author') {
      this.dataLoading = false;
      this.booksError = 'Compte auteur requis pour les statistiques catalogue.';
      return;
    }
    this.bookService.getMyBooks(0, 32).subscribe({
      next: books => {
        const pub = books.filter(b => (b.status || '').toUpperCase() === 'PUBLISHED');
        const inProgress = books.filter(b =>
          ['DRAFT', 'REJECTED'].includes((b.status || '').toUpperCase()),
        );
        const n = pub.length;
        const views = pub.reduce((s, b) => s + (b.sales || 0), 0);
        const reviews = pub.reduce((s, b) => s + (b.reviewCount || 0), 0);
        const avg =
          n > 0 ? (pub.reduce((s, b) => s + b.price, 0) / n).toFixed(2) : '—';
        const progressHint =
          inProgress.length > 0 ? ` · ${inProgress.length} brouillon(s) ou refus` : '';
        this.authorStats = [
          {
            label: 'Titres publiés',
            value: String(n),
            hint: 'Visibles sur le catalogue public' + progressHint,
          },
          {
            label: 'Vues (catalogue)',
            value: views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views),
            hint: 'Cumul vues fiches',
          },
          { label: 'Avis reçus', value: String(reviews), hint: 'Titres publiés' },
          { label: 'Prix moyen', value: `${avg} €`, hint: 'Sur titres publiés' },
        ];
        const focus =
          books.find(b => ['DRAFT', 'REJECTED'].includes((b.status || '').toUpperCase())) || books[0];
        if (focus) {
          const progress = Math.min(95, 20 + ((focus.sales ?? 0) % 75));
          const isPub = (focus.status || '').toUpperCase() === 'PUBLISHED';
          this.currentProject = {
            title: focus.title + (isPub ? '' : ' (brouillon / refus)'),
            blurb:
              focus.description ||
              'Aucune description longue — complétez depuis la création ou la fiche catalogue.',
            progress,
            cover: focus.coverImage,
          };
        } else {
          this.currentProject = {
            title: 'Aucun titre',
            blurb:
              'Créez un livre pour voir ici la progression ; les métriques catalogue suivent vos publications.',
            progress: 0,
            cover: PLACEHOLDER_COVER,
          };
        }
        this.activities = books.slice(0, 5).map((b, i) => ({
          icon: 'fas fa-book',
          title: `« ${b.title} » — ${this.statusSnippet(b.status)} · ${b.sales || 0} vues · ${b.reviewCount} avis`,
          time: i === 0 ? 'Récent' : 'Vos titres',
        }));
        if (this.activities.length === 0) {
          this.activities = [
            { icon: 'fas fa-inbox', title: 'Aucun livre encore — créez-en un', time: 'Démarrage' },
          ];
        }
        this.dataLoading = false;
      },
      error: () => {
        this.booksError = 'Impossible de charger vos ouvrages (API).';
        this.dataLoading = false;
      },
    });
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  private statusSnippet(s: string | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'PUBLISHED':
        return 'Publié';
      case 'DRAFT':
        return 'Brouillon';
      case 'REJECTED':
        return 'Refusé';
      default:
        return s || 'Statut inconnu';
    }
  }
}
