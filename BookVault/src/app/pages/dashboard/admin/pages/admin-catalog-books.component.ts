import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import {
  AdminCatalogService,
  BookStatusFilter,
} from '../../../../services/admin-catalog.service';
import { AuthorService } from '../../../../services/author.service';
import { PLACEHOLDER_COVER } from '../../../../services/book.service';
import { BookDetailDto, BookListItemDto } from '../../../../models/api.types';
import { environment } from '../../../../../environments/environment';

type BannerKind = 'success' | 'danger' | 'info';

@Component({
  standalone: true,
  selector: 'app-admin-catalog-books',
  imports: [CommonModule, RouterModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './admin-catalog-books.component.html',
})
export class AdminCatalogBooksComponent implements OnInit, OnDestroy {
  private readonly sub = new Subscription();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  loadingList = false;
  loadingDetail = false;
  listError: string | null = null;

  books: BookListItemDto[] = [];
  selected: BookDetailDto | null = null;
  authorNames = new Map<string, string>();

  totalElements = 0;
  totalPages = 0;
  page = 0;
  pageSize = 15;

  filterStatus: BookStatusFilter = '';
  searchQuery = '';
  apiSearch = '';

  banner: { kind: BannerKind; text: string } | null = null;
  busyPublish = false;

  constructor(
    private adminCatalog: AdminCatalogService,
    private authorService: AuthorService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  get publishedCountOnPage(): number {
    return this.books.filter(b => b.status === 'PUBLISHED').length;
  }

  get draftCountOnPage(): number {
    return this.books.filter(b => b.status === 'DRAFT').length;
  }

  clearBanner(): void {
    this.banner = null;
  }

  onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.apiSearch = this.searchQuery.trim();
      this.page = 0;
      this.selected = null;
      this.loadList();
    }, 350);
  }

  applyFilters(): void {
    this.apiSearch = this.searchQuery.trim();
    this.page = 0;
    this.selected = null;
    this.loadList();
  }

  loadList(): void {
    this.loadingList = true;
    this.listError = null;

    this.adminCatalog
      .listBooks({
        page: this.page,
        size: this.pageSize,
        status: this.filterStatus || undefined,
        q: this.apiSearch || undefined,
        sort: 'createdAt,desc',
      })
      .pipe(finalize(() => (this.loadingList = false)))
      .subscribe({
        next: res => {
          this.books = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.page = res.number;
          this.loadAuthorNames();
          if (this.selected && !this.books.some(b => b.id === this.selected!.id)) {
            this.selected = null;
          }
        },
        error: () => {
          this.listError = 'Impossible de charger le catalogue admin.';
          this.books = [];
        },
      });
  }

  private loadAuthorNames(): void {
    const ids = [...new Set(this.books.map(b => b.authorId))];
    for (const id of ids) {
      if (this.authorNames.has(id)) continue;
      this.authorService.getProfile(id).subscribe({
        next: p => this.authorNames.set(id, p.penName || 'Auteur'),
        error: () => this.authorNames.set(id, 'Auteur'),
      });
    }
  }

  authorName(authorId: string): string {
    return this.authorNames.get(authorId) ?? '…';
  }

  goPage(delta: number): void {
    const next = this.page + delta;
    if (next < 0 || next >= this.totalPages) return;
    this.page = next;
    this.loadList();
  }

  selectBook(book: BookListItemDto): void {
    if (this.selected?.id === book.id) return;
    this.clearBanner();
    this.loadingDetail = true;
    this.adminCatalog
      .getBook(book.id)
      .pipe(finalize(() => (this.loadingDetail = false)))
      .subscribe({
        next: d => {
          this.selected = d;
          if (!this.authorNames.has(d.authorId)) {
            this.authorService.getProfile(d.authorId).subscribe({
              next: p => this.authorNames.set(d.authorId, p.penName || 'Auteur'),
              error: () => this.authorNames.set(d.authorId, 'Auteur'),
            });
          }
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de charger le détail du livre.' };
        },
      });
  }

  togglePublish(): void {
    if (!this.selected || this.busyPublish) return;
    const publish = this.selected.status !== 'PUBLISHED';
    this.busyPublish = true;
    this.adminCatalog
      .setPublished(this.selected.id, publish)
      .pipe(finalize(() => (this.busyPublish = false)))
      .subscribe({
        next: d => {
          this.selected = d;
          const idx = this.books.findIndex(b => b.id === d.id);
          if (idx >= 0) {
            this.books[idx] = {
              ...this.books[idx],
              status: d.status,
              publishedAt: d.publishedAt,
            };
          }
          this.banner = {
            kind: 'success',
            text: publish ? 'Livre publié.' : 'Livre dépublié (brouillon).',
          };
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de modifier la publication.' };
        },
      });
  }

  coverUrl(book: { id: string; coverUrl: string | null }): string {
    if (book.coverUrl?.trim()) {
      const url = book.coverUrl.trim();
      if (url.startsWith('http')) return url;
      return url.startsWith('/') ? url : `/${url}`;
    }
    return `${environment.apiUrl}/files/cover/${book.id}`;
  }

  onCoverErr(ev: Event): void {
    (ev.target as HTMLImageElement).src = PLACEHOLDER_COVER;
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'Publié';
      case 'DRAFT':
        return 'Brouillon';
      case 'REJECTED':
        return 'Refusé';
      default:
        return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
      case 'DRAFT':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
      case 'REJECTED':
        return 'bg-red-500/15 text-red-700 dark:text-red-300';
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-zinc-300';
    }
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
      });
    } catch {
      return iso;
    }
  }
}
