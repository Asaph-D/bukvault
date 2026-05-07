import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService } from '../../../../services/book.service';
import { BookCategory } from '../../../../models/book.model';

@Component({
  standalone: true,
  selector: 'app-reader-discover',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mb-8 dash-animate-in">
      <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">
        Découvrir
      </h1>
      <p class="text-slate-600 dark:text-zinc-400 mt-1 text-sm">Parcourez les catégories sans quitter le tableau de bord.</p>
    </header>
    <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
    <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
    <div class="flex flex-wrap gap-3" *ngIf="!loading && !error">
      <a
        *ngFor="let c of categories"
        [routerLink]="['/categories', c.slug]"
        class="px-6 py-3 text-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition"
        >{{ c.name }}</a
      >
    </div>
  `,
})
export class ReaderDiscoverComponent implements OnInit {
  categories: BookCategory[] = [];
  loading = true;
  error: string | null = null;

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getCategories().subscribe({
      next: c => {
        this.categories = c;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les catégories.';
        this.loading = false;
      },
    });
  }
}
