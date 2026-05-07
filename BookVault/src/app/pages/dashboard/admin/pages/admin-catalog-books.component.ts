import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { Book } from '../../../../models/book.model';

@Component({
  standalone: true,
  selector: 'app-admin-catalog-books',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mb-8 dash-animate-in">
      <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">
        Catalogue livres
      </h1>
      <p class="text-slate-600 dark:text-zinc-400 mt-1 text-sm">Vue consolidée — même source que le catalogue public.</p>
    </header>
    <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
    <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
    <div *ngIf="!loading && !error" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        *ngFor="let book of books"
        class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm"
      >
        <img
          [src]="book.coverImage"
          (error)="onCoverErr($event)"
          [alt]="book.title"
          class="w-full h-52 object-cover"
        />
        <div class="p-4">
          <h2 class="font-semibold text-lg text-slate-900 dark:text-white">{{ book.title }}</h2>
          <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-2">{{ book.author }}</p>
          <div class="flex justify-between items-center mt-2">
            <span class="font-semibold text-indigo-600 dark:text-indigo-400">{{ book.price | currency: 'EUR' }}</span>
            <a [routerLink]="['/books', book.id]" class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Fiche publique</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminCatalogBooksComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error: string | null = null;

  constructor(private bookService: BookService) {}

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  ngOnInit(): void {
    this.bookService.getBooks(0, 48).subscribe({
      next: b => {
        this.books = b;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le catalogue.';
        this.loading = false;
      },
    });
  }
}
