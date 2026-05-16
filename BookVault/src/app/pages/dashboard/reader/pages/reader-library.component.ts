import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { Book } from '../../../../models/book.model';
import { BookDetailComponent } from '../../../../pages/books/book-detail/book-detail.component';
import { SelectedBookService } from '../services/selected-book.service';

@Component({
  standalone: true,
  selector: 'app-reader-library',
  imports: [CommonModule, RouterModule, BookDetailComponent],
  template: `
    <div class="flex flex-col gap-6">
      <header class="dash-animate-in">
        <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">
          Ma bibliothèque (catalogue)
        </h1>
        <p class="text-slate-600 dark:text-zinc-400 mt-1 text-sm">Les mêmes données que le catalogue public, affichées dans votre espace.</p>
      </header>

      <!-- Vue de détail du livre si sélectionné -->
      <div *ngIf="selectedBookId$ | async as bookId" class="mb-8 border-b border-slate-200 dark:border-slate-700 pb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Détails du livre</h2>
          <button
            (click)="closeBookDetail()"
            class="text-sm px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:brightness-110"
          >
            Fermer
          </button>
        </div>
        <app-book-detail [bookId]="bookId"></app-book-detail>
      </div>

      <!-- Liste des livres -->
      <div>
        <h2 *ngIf="selectedBookId$ | async" class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Sélectionner un autre livre</h2>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <div *ngIf="!loading && !error" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            *ngFor="let book of books"
            class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          >
            <img
              [src]="book.coverImage"
              (error)="onCoverErr($event)"
              [alt]="book.title"
              class="w-full h-56 object-cover"
            />
            <div class="p-4">
              <h3 class="font-semibold text-lg text-slate-900 dark:text-white">{{ book.title }}</h3>
              <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-2">{{ book.author }}</p>
              <div class="flex justify-between items-center mt-2 gap-2">
                <span class="font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{{ book.price | currency: 'EUR' }}</span>
                <button
                  (click)="selectBook(book.id)"
                  class="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:brightness-110 flex-1"
                >
                  Voir détail
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ReaderLibraryComponent implements OnInit {
  books: Book[] = [];
  loading = true;
  error: string | null = null;
  selectedBookId$ = this.selectedBookService.selectedBookId$;

  constructor(
    private bookService: BookService,
    private selectedBookService: SelectedBookService,
    private route: ActivatedRoute
  ) {}

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  selectBook(bookId: string): void {
    this.selectedBookService.selectBook(bookId);
  }

  closeBookDetail(): void {
    this.selectedBookService.clearSelection();
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
