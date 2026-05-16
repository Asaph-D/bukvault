import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { BookService, PLACEHOLDER_COVER } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/book.model';

export type PublicationSheetMode = 'auto' | 'published' | 'pending';

@Component({
  standalone: true,
  selector: 'app-publication-sheet',
  imports: [CommonModule, RouterModule],
  templateUrl: './publication-sheet.component.html',
})
export class PublicationSheetComponent implements OnInit, OnChanges {
  @Input({ required: true }) bookId = '';
  @Input() mode: PublicationSheetMode = 'auto';
  @Input() compact = false;

  loading = true;
  error: string | null = null;
  book: Book | null = null;
  penName = '';
  accessDenied = false;

  constructor(
    private bookService: BookService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bookId'] && !changes['bookId'].firstChange) {
      this.load();
    }
  }

  get displayMode(): 'published' | 'pending' {
    if (this.mode === 'published') return 'published';
    if (this.mode === 'pending') return 'pending';
    if (this.book?.status === 'PUBLISHED') return 'published';
    return 'pending';
  }

  get isPublished(): boolean {
    return this.displayMode === 'published';
  }

  private load(): void {
    if (!this.bookId) {
      this.error = 'Identifiant du livre manquant.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.error = null;
    this.accessDenied = false;
    this.bookService
      .getBookById(this.bookId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: b => {
          if (!b) {
            this.accessDenied = true;
            this.error =
              'Fiche indisponible. Le livre est peut-être en attente de validation (connexion auteur ou admin requise).';
            return;
          }
          this.book = b;
          this.penName = b.author?.trim() || 'Auteur';
        },
        error: () => {
          this.error = 'Impossible de charger la fiche de publication.';
        },
      });
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  formatDate(d: Date | undefined): string {
    if (!d) return '—';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  get canManageAsAuthor(): boolean {
    const u = this.auth.getCurrentUser();
    return !!u && u.role === 'author' && this.book?.authorId === u.id;
  }

  get canManageAsAdmin(): boolean {
    return this.auth.getCurrentUser()?.role === 'admin';
  }
}
