import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { BookService, PLACEHOLDER_COVER } from '../../../../services/book.service';
import { AuthService } from '../../../../services/auth.service';
import { Book } from '../../../../models/book.model';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';

@Component({
  standalone: true,
  selector: 'app-author-works',
  imports: [CommonModule, RouterModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './author-works.component.html',
})
export class AuthorWorksComponent implements OnInit {
  readonly PLACEHOLDER_COVER = PLACEHOLDER_COVER;

  books: Book[] = [];
  filtered: Book[] = [];
  loading = true;
  error: string | null = null;

  searchQuery = '';
  statusFilter: '' | 'PUBLISHED' | 'DRAFT' | 'REJECTED' = '';

  /** Livre en cours d’action API (désactive les boutons sur la carte). */
  busyBookId: string | null = null;
  /** Retour utilisateur après une action. */
  actionFeedback: { kind: 'ok' | 'err'; text: string } | null = null;

  constructor(
    private auth: AuthService,
    private bookService: BookService,
  ) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser();
    if (!u || u.role !== 'author') {
      this.error = 'Compte auteur requis.';
      this.loading = false;
      return;
    }
    this.loadBooks();
  }

  private loadBooks(): void {
    this.bookService.getMyBooks(0, 64).subscribe({
      next: books => {
        this.books = books;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos œuvres.';
        this.loading = false;
      },
    });
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    let list = [...this.books];
    if (this.statusFilter) {
      list = list.filter(b => (b.status || '').toUpperCase() === this.statusFilter);
    }
    if (q) {
      list = list.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)),
      );
    }
    this.filtered = list;
  }

  statusNorm(book: Book): string {
    return (book.status || '').toUpperCase();
  }

  statusLabel(s: string | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'PUBLISHED':
        return 'Publié';
      case 'DRAFT':
        return 'Brouillon';
      case 'REJECTED':
        return 'Refusé';
      default:
        return s || '—';
    }
  }

  statusClass(s: string | undefined): string {
    switch ((s || '').toUpperCase()) {
      case 'PUBLISHED':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'DRAFT':
        return 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30';
      case 'REJECTED':
        return 'bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/30';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25';
    }
  }

  get publishedCount(): number {
    return this.books.filter(b => (b.status || '').toUpperCase() === 'PUBLISHED').length;
  }

  get draftCount(): number {
    return this.books.filter(b => (b.status || '').toUpperCase() === 'DRAFT').length;
  }

  get rejectedCount(): number {
    return this.books.filter(b => (b.status || '').toUpperCase() === 'REJECTED').length;
  }

  private setFeedback(kind: 'ok' | 'err', text: string): void {
    this.actionFeedback = { kind, text };
    window.setTimeout(() => {
      if (this.actionFeedback?.text === text) {
        this.actionFeedback = null;
      }
    }, 6000);
  }

  private apiMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object') {
        if ('message' in body && typeof (body as { message: unknown }).message === 'string') {
          return (body as { message: string }).message;
        }
        if ('detail' in body && typeof (body as { detail: unknown }).detail === 'string') {
          return (body as { detail: string }).detail;
        }
      }
    }
    return 'Opération impossible. Réessayez ou vérifiez la fiche (titre et catégories requis pour la validation).';
  }

  submitForReview(book: Book): void {
    if (this.busyBookId) return;
    this.busyBookId = book.id;
    this.bookService
      .submitForReview(book.id)
      .pipe(finalize(() => (this.busyBookId = null)))
      .subscribe({
        next: () => {
          this.setFeedback('ok', `« ${book.title} » a été envoyé pour validation.`);
          this.loadBooksQuiet();
        },
        error: err => this.setFeedback('err', this.apiMessage(err)),
      });
  }

  publishNow(book: Book): void {
    if (
      !window.confirm(`Publier « ${book.title} » tout de suite sur le catalogue ? (Les lecteurs pourront voir la fiche.)`)
    ) {
      return;
    }
    if (this.busyBookId) return;
    this.busyBookId = book.id;
    this.bookService
      .setPublished(book.id, true)
      .pipe(finalize(() => (this.busyBookId = null)))
      .subscribe({
        next: () => {
          this.setFeedback('ok', `« ${book.title} » est publié.`);
          this.loadBooksQuiet();
        },
        error: err => this.setFeedback('err', this.apiMessage(err)),
      });
  }

  unpublish(book: Book): void {
    if (!window.confirm(`Retirer « ${book.title} » du catalogue public ? Il restera en brouillon.`)) {
      return;
    }
    if (this.busyBookId) return;
    this.busyBookId = book.id;
    this.bookService
      .setPublished(book.id, false)
      .pipe(finalize(() => (this.busyBookId = null)))
      .subscribe({
        next: () => {
          this.setFeedback('ok', `« ${book.title} » n’est plus exposé comme publié.`);
          this.loadBooksQuiet();
        },
        error: err => this.setFeedback('err', this.apiMessage(err)),
      });
  }

  deleteBook(book: Book): void {
    if (
      !window.confirm(
        `Supprimer « ${book.title} » du catalogue ? Cette action est définitive côté service (livre masqué).`,
      )
    ) {
      return;
    }
    if (this.busyBookId) return;
    this.busyBookId = book.id;
    this.bookService
      .deleteBookRaw(book.id)
      .pipe(finalize(() => (this.busyBookId = null)))
      .subscribe({
        next: () => {
          this.setFeedback('ok', `« ${book.title} » a été supprimé.`);
          this.loadBooksQuiet();
        },
        error: err => this.setFeedback('err', this.apiMessage(err)),
      });
  }

  /** Recharge après action sans passer par l’état loading plein écran. */
  private loadBooksQuiet(): void {
    this.bookService.getMyBooks(0, 64).subscribe({
      next: books => {
        this.books = books;
        this.applyFilters();
      },
      error: () => this.setFeedback('err', 'Liste non actualisée — rechargez la page.'),
    });
  }
}
