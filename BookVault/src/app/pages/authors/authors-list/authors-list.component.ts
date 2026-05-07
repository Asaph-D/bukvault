import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthorService } from '../../../services/author.service';
import { AuthorPublicProfileDto } from '../../../models/api.types';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  selector: 'app-authors-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-10">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Auteurs</h1>
        <p class="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">
          Annuaire fourni par le microservice auteur (peut être vide tant que les profils ne sont pas créés).
        </p>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="!loading && error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <div
          *ngIf="!loading && !error && authors.length === 0"
          class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 text-center text-zinc-600 dark:text-zinc-400"
        >
          Aucun auteur listé pour le moment. Les fiches publiques sont créées lorsque des auteurs complètent leur
          profil.
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" *ngIf="authors.length">
          <a
            *ngFor="let a of authors"
            [routerLink]="['/authors', a.authorId]"
            class="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:border-indigo-500/50 transition"
          >
            <h2 class="text-xl font-semibold text-slate-900 dark:text-white">{{ a.penName }}</h2>
            <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-3">{{ a.bio || 'Pas de biographie.' }}</p>
          </a>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class AuthorsListComponent implements OnInit {
  authors: AuthorPublicProfileDto[] = [];
  loading = true;
  error: string | null = null;

  constructor(private authorService: AuthorService) {}

  ngOnInit(): void {
    this.authorService.listAuthors(0, 48).subscribe({
      next: rows => {
        this.authors = rows;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger l’annuaire auteurs.';
        this.loading = false;
      }
    });
  }
}
