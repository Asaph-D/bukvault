import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { AuthService } from '../../../../services/auth.service';
import { AuthorService } from '../../../../services/author.service';
import { forkJoin } from 'rxjs';

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
    private authorService: AuthorService,
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
    forkJoin({
      myBooks: this.bookService.getMyBooks(0, 32),
      dash: this.authorService.myDashboard(),
      stats: this.authorService.myStats(),
    }).subscribe({
      next: ({ myBooks: books, dash, stats }) => {
        const pub = books.filter(b => (b.status || '').toUpperCase() === 'PUBLISHED');
        const inProgress = books.filter(b =>
          ['DRAFT', 'REJECTED'].includes((b.status || '').toUpperCase()),
        );
        const nPubUi = pub.length;
        const nDraftUi = inProgress.length;

        const published = Number.isFinite(dash?.publishedBooksEstimate)
          ? dash.publishedBooksEstimate
          : nPubUi;
        const drafts = Number.isFinite(dash?.draftBooksEstimate) ? dash.draftBooksEstimate : nDraftUi;

        const sales = stats?.totalSalesEstimate ?? 0;
        const revenue = stats?.revenueEstimate ?? 0;

        this.authorStats = [
          {
            label: 'Œuvres publiées',
            value: String(published),
            hint: dash?.hint || 'Source catalog-service via author-service',
          },
          {
            label: 'Brouillons / refus',
            value: String(drafts),
            hint: 'Comptés depuis le catalogue auteur',
          },
          {
            label: 'Ventes (unités)',
            value: sales >= 1000 ? `${(sales / 1000).toFixed(1)}k` : String(sales),
            hint: stats?.note || 'Commandes payées (order-service)',
          },
          {
            label: 'Revenus',
            value: `${Number(revenue).toFixed(2)} €`,
            hint: 'Somme des lignes payées (order-service)',
          },
        ];

        const focus =
          books.find(b => ['DRAFT', 'REJECTED'].includes((b.status || '').toUpperCase())) ||
          books[0];
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
          title: `« ${b.title} » — ${this.statusSnippet(b.status)} · ${b.sales || 0} indicateur · ${b.reviewCount} avis`,
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
