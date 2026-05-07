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
    { icon: 'fas fa-plus', label: 'Chapitre', link: '/dashboard/author/chapters' },
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
    this.bookService.getBooksByAuthor(u.id, 0, 32).subscribe({
      next: books => {
        const n = books.length;
        const views = books.reduce((s, b) => s + (b.sales || 0), 0);
        const reviews = books.reduce((s, b) => s + (b.reviewCount || 0), 0);
        const avg =
          n > 0 ? (books.reduce((s, b) => s + b.price, 0) / n).toFixed(2) : '—';
        this.authorStats = [
          { label: 'Œuvres publiées', value: String(n), hint: 'Visibles sur le catalogue' },
          { label: 'Vues (catalogue)', value: views >= 1000 ? `${(views / 1000).toFixed(1)}k` : String(views), hint: 'Cumul vues fiches' },
          { label: 'Avis reçus', value: String(reviews), hint: 'Tous titres' },
          { label: 'Prix moyen', value: `${avg} €`, hint: 'Prix catalogue' },
        ];
        if (books[0]) {
          const b = books[0];
          const progress = Math.min(95, 20 + (b.sales || 0) % 75);
          this.currentProject = {
            title: b.title,
            blurb: b.description || 'Aucune description longue — éditez la fiche dans le catalogue.',
            progress,
            cover: b.coverImage,
          };
        } else {
          this.currentProject = {
            title: 'Aucun titre publié',
            blurb: 'Créez un livre pour voir ici la progression et les métriques catalogue.',
            progress: 0,
            cover: PLACEHOLDER_COVER,
          };
        }
        this.activities = books.slice(0, 3).map((b, i) => ({
          icon: 'fas fa-book',
          title: `« ${b.title} » — ${b.sales || 0} vues · ${b.reviewCount} avis`,
          time: i === 0 ? 'Récemment' : 'Dans le catalogue',
        }));
        if (this.activities.length === 0) {
          this.activities = [
            { icon: 'fas fa-inbox', title: 'Aucun livre publié pour l’instant', time: 'Publiez depuis le formulaire' },
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
}
