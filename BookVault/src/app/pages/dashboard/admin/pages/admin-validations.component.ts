import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { PublicationSheetComponent } from '../../../../shared/publication-sheet/publication-sheet.component';
import { AdminCatalogService } from '../../../../services/admin-catalog.service';
import { AdminUsersService } from '../../../../services/admin-users.service';
import { AuthorService } from '../../../../services/author.service';
import { PLACEHOLDER_COVER } from '../../../../services/book.service';
import { environment } from '../../../../../environments/environment';
import { BookDetailDto, BookListItemDto, UserProfileDto } from '../../../../models/api.types';

type DetailTab = 'dossier' | 'preview-pending' | 'preview-published';

interface AuthorValidationContext {
  profile: UserProfileDto | null;
  penName: string;
  authorBio: string | null;
  publishedCount: number;
  draftCount: number;
  rejectedCount: number;
  totalBooks: number;
  publishedTitles: string[];
}

@Component({
  standalone: true,
  selector: 'app-admin-validations',
  imports: [CommonModule, RouterModule, DashboardInternalHeaderComponent, PublicationSheetComponent],
  templateUrl: './admin-validations.component.html',
})
export class AdminValidationsComponent implements OnInit {
  rows: BookListItemDto[] = [];
  authorNames = new Map<string, string>();

  loading = false;
  loadingDetail = false;
  listError: string | null = null;
  detailError: string | null = null;
  banner: { kind: 'success' | 'danger'; text: string } | null = null;

  selected: BookListItemDto | null = null;
  bookDetail: BookDetailDto | null = null;
  authorContext: AuthorValidationContext | null = null;
  detailTab: DetailTab = 'dossier';
  busyId: string | null = null;

  constructor(
    private adminCatalog: AdminCatalogService,
    private adminUsers: AdminUsersService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  get publishedBefore(): boolean {
    return (this.authorContext?.publishedCount ?? 0) > 0;
  }

  get isFirstBook(): boolean {
    return (this.authorContext?.totalBooks ?? 0) <= 1;
  }

  loadList(): void {
    this.loading = true;
    this.listError = null;
    this.adminCatalog
      .listBooks({ status: 'DRAFT', size: 50, sort: 'createdAt,desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: res => {
          this.rows = res.content;
          this.prefetchAuthorNames();
          if (this.selected && !this.rows.some(r => r.id === this.selected!.id)) {
            this.selected = null;
            this.bookDetail = null;
            this.authorContext = null;
          }
        },
        error: () => {
          this.listError = 'Impossible de charger la file de validations.';
          this.rows = [];
        },
      });
  }

  private prefetchAuthorNames(): void {
    for (const row of this.rows) {
      if (this.authorNames.has(row.authorId)) continue;
      this.authorService.getProfile(row.authorId).subscribe({
        next: p => this.authorNames.set(row.authorId, p.penName || 'Auteur'),
        error: () => this.authorNames.set(row.authorId, 'Auteur'),
      });
    }
  }

  authorName(authorId: string): string {
    return this.authorNames.get(authorId) ?? '…';
  }

  selectRow(row: BookListItemDto): void {
    if (this.selected?.id === row.id) return;
    this.clearBanner();
    this.selected = row;
    this.bookDetail = null;
    this.authorContext = null;
    this.detailTab = 'dossier';
    this.loadDetail(row);
  }

  private loadDetail(row: BookListItemDto): void {
    this.loadingDetail = true;
    this.detailError = null;

    forkJoin({
      book: this.adminCatalog.getBook(row.id),
      profile: this.adminUsers.getById(row.authorId).pipe(catchError(() => of(null))),
      pen: this.authorService.getProfile(row.authorId).pipe(catchError(() => of(null))),
      allBooks: this.adminCatalog
        .listBooks({ authorId: row.authorId, size: 100, sort: 'createdAt,desc' })
        .pipe(catchError(() => of({ content: [] as BookListItemDto[], totalElements: 0 }))),
    })
      .pipe(finalize(() => (this.loadingDetail = false)))
      .subscribe({
        next: ({ book, profile, pen, allBooks }) => {
          this.bookDetail = book;
          const books = allBooks.content ?? [];
          const published = books.filter(b => b.status === 'PUBLISHED' && b.id !== row.id);
          const drafts = books.filter(b => b.status === 'DRAFT');
          const rejected = books.filter(b => b.status === 'REJECTED');
          this.authorContext = {
            profile,
            penName: pen?.penName || (profile ? `${profile.firstName} ${profile.lastName}` : 'Auteur'),
            authorBio: pen?.bio ?? profile?.bio ?? null,
            publishedCount: published.length,
            draftCount: drafts.length,
            rejectedCount: rejected.length,
            totalBooks: books.length,
            publishedTitles: published.slice(0, 5).map(b => b.title),
          };
        },
        error: () => {
          this.detailError = 'Impossible de charger le dossier de validation.';
        },
      });
  }

  approve(): void {
    if (!this.selected || this.busyId) return;
    const id = this.selected.id;
    this.busyId = id;
    this.adminCatalog.setPublished(id, true).subscribe({
      next: () => {
        this.rows = this.rows.filter(r => r.id !== id);
        this.selected = null;
        this.bookDetail = null;
        this.authorContext = null;
        this.busyId = null;
        this.banner = { kind: 'success', text: 'Livre publié. L’auteur a été notifié.' };
      },
      error: () => {
        this.busyId = null;
        this.banner = { kind: 'danger', text: 'Échec de la publication.' };
      },
    });
  }

  clearBanner(): void {
    this.banner = null;
  }

  coverUrl(book: BookListItemDto | BookDetailDto): string {
    const id = book.id;
    const url = book.coverUrl?.trim();
    if (url) {
      if (url.startsWith('http')) return url;
      return url.startsWith('/') ? url : `/${url}`;
    }
    return `${environment.apiUrl}/files/cover/${id}`;
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  formatLabel(fmt: string): string {
    switch (fmt) {
      case 'EBOOK':
        return 'Numérique';
      case 'PHYSICAL':
        return 'Papier';
      case 'BOTH':
        return 'Les deux';
      default:
        return fmt;
    }
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}
