import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PLACEHOLDER_COVER, resolveCoverImageUrl } from '../../../../services/book.service';
import { environment } from '../../../../../environments/environment';
import { OrderService } from '../../../../services/order.service';
import { PurchasedBookDto } from '../../../../models/api.types';
import { BookDetailComponent } from '../../../../pages/books/book-detail/book-detail.component';
import { SelectedBookService } from '../services/selected-book.service';
import { FileService } from '../../../../services/file.service';
import { UiToastService } from '../../../../services/ui-toast.service';

@Component({
  standalone: true,
  selector: 'app-reader-library',
  imports: [CommonModule, RouterModule, BookDetailComponent],
  template: `
    <div class="flex flex-col gap-6">
      <header class="dash-animate-in">
        <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">
          Ma bibliothèque
        </h1>
        <p class="text-slate-600 dark:text-zinc-400 mt-1 text-sm">
          Vos livres numériques achetés — lisez en ligne ou téléchargez le manuscrit.
        </p>
      </header>

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

      <div>
        <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement…</p>
        <p *ngIf="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
        <p *ngIf="!loading && !error && books.length === 0" class="text-zinc-600 dark:text-zinc-400">
          Vous n'avez pas encore acheté de livre numérique.
          <a routerLink="/books" class="text-indigo-600 dark:text-indigo-400 hover:underline ml-1">Parcourir le catalogue</a>
        </p>
        <div *ngIf="!loading && !error && books.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            *ngFor="let book of books"
            class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              [src]="coverUrl(book)"
              (error)="onCoverErr($event)"
              [alt]="book.title"
              class="w-full h-56 object-cover"
            />
            <div class="p-4">
              <h3 class="font-semibold text-lg text-slate-900 dark:text-white">{{ book.title }}</h3>
              <p class="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                Acheté le {{ book.purchasedAt | date:'mediumDate' }}
              </p>
              <div class="flex flex-wrap gap-2 mt-3">
                <a
                  [routerLink]="['/books', book.bookId]"
                  class="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:brightness-110"
                >
                  Lire
                </a>
                <button
                  type="button"
                  (click)="downloadBook(book)"
                  [disabled]="downloadingId === book.bookId"
                  class="text-sm border border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-50"
                >
                  <span *ngIf="downloadingId !== book.bookId">Télécharger</span>
                  <span *ngIf="downloadingId === book.bookId"><i class="fas fa-spinner fa-spin"></i></span>
                </button>
                <button
                  type="button"
                  (click)="selectBook(book.bookId)"
                  class="text-sm text-zinc-600 dark:text-zinc-400 px-2 py-1.5 hover:underline"
                >
                  Détails
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
  books: PurchasedBookDto[] = [];
  loading = true;
  error: string | null = null;
  downloadingId: string | null = null;
  placeholder = PLACEHOLDER_COVER;
  selectedBookId$ = this.selectedBookService.selectedBookId$;

  constructor(
    private orderService: OrderService,
    private selectedBookService: SelectedBookService,
    private fileService: FileService,
    private toast: UiToastService,
    private route: ActivatedRoute,
  ) {}

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = this.placeholder;
  }

  coverUrl(book: PurchasedBookDto): string {
    return resolveCoverImageUrl(book.coverUrl, book.bookId, environment.apiUrl);
  }

  selectBook(bookId: string): void {
    this.selectedBookService.selectBook(bookId);
  }

  closeBookDetail(): void {
    this.selectedBookService.clearSelection();
  }

  downloadBook(book: PurchasedBookDto): void {
    this.downloadingId = book.bookId;
    this.fileService.downloadEbook(book.bookId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${book.title.replace(/[^\w\s-]/g, '').trim() || 'ebook'}.bin`;
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingId = null;
        this.toast.success('Téléchargement démarré', book.title);
      },
      error: () => {
        this.downloadingId = null;
        this.toast.error('Téléchargement impossible', 'Droits ou fichier manquant.');
      },
    });
  }

  ngOnInit(): void {
    this.orderService.listMyLibrary().subscribe({
      next: books => {
        this.books = books;
        this.loading = false;
        const openId = this.route.snapshot.queryParamMap.get('bookId');
        if (openId) {
          this.selectBook(openId);
        }
      },
      error: () => {
        this.error = 'Impossible de charger votre bibliothèque.';
        this.loading = false;
      },
    });
  }
}
