import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { AdminUsersService } from '../../../../services/admin-users.service';
import { AdminCatalogService } from '../../../../services/admin-catalog.service';
import { AuthorService } from '../../../../services/author.service';
import { AuthService } from '../../../../services/auth.service';
import { BookListItemDto, UserProfileDto } from '../../../../models/api.types';
import { environment } from '../../../../../environments/environment';
import { PLACEHOLDER_COVER } from '../../../../services/book.service';

type BannerKind = 'success' | 'danger' | 'info';

@Component({
  standalone: true,
  selector: 'app-admin-authors',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardInternalHeaderComponent,
  ],
  templateUrl: './admin-authors.component.html',
})
export class AdminAuthorsComponent implements OnInit, OnDestroy {
  private readonly sub = new Subscription();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  loadingList = false;
  loadingDetail = false;
  loadingWorks = false;
  listError: string | null = null;
  worksError: string | null = null;

  authors: UserProfileDto[] = [];
  authorWorks: BookListItemDto[] = [];
  penNames = new Map<string, string>();
  totalElements = 0;
  totalPages = 0;
  page = 0;
  pageSize = 15;

  filterActive: 'all' | 'true' | 'false' = 'all';
  searchQuery = '';

  selected: UserProfileDto | null = null;
  detailTab: 'profile' | 'works' = 'profile';

  banner: { kind: BannerKind; text: string } | null = null;

  busyActive = false;
  busyProfile = false;

  currentAdminId: string | null = null;

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    bio: [''],
    avatarUrl: [''],
    preferredLanguage: [''],
    newsletter: [false],
  });

  constructor(
    private fb: FormBuilder,
    private adminUsers: AdminUsersService,
    private adminCatalog: AdminCatalogService,
    private authorService: AuthorService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.auth.currentUser$.subscribe(u => {
        this.currentAdminId = u?.id ?? null;
      })
    );
    this.loadList();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  get filteredAuthors(): UserProfileDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.authors;
    return this.authors.filter(u => {
      const pen = this.penNames.get(u.id) ?? '';
      const hay = `${u.firstName} ${u.lastName} ${u.email} ${pen}`.toLowerCase();
      return hay.includes(q);
    });
  }

  get activeCountOnPage(): number {
    return this.authors.filter(u => u.active).length;
  }

  clearBanner(): void {
    this.banner = null;
  }

  onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => undefined, 200);
  }

  applyFilters(): void {
    this.page = 0;
    this.selected = null;
    this.authorWorks = [];
    this.loadList();
  }

  loadList(): void {
    this.loadingList = true;
    this.listError = null;
    const activeParam =
      this.filterActive === 'all' ? null : this.filterActive === 'true';

    this.adminUsers
      .list({
        page: this.page,
        size: this.pageSize,
        role: 'AUTHOR',
        active: activeParam,
        sort: 'createdAt,desc',
      })
      .pipe(finalize(() => (this.loadingList = false)))
      .subscribe({
        next: res => {
          this.authors = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.page = res.number;
          this.loadPenNamesForPage();
          if (this.selected && !this.authors.some(u => u.id === this.selected!.id)) {
            this.selected = null;
            this.authorWorks = [];
          }
        },
        error: () => {
          this.listError = 'Impossible de charger la liste des auteurs.';
          this.authors = [];
        },
      });
  }

  private loadPenNamesForPage(): void {
    for (const u of this.authors) {
      if (this.penNames.has(u.id)) continue;
      this.authorService.getProfile(u.id).subscribe({
        next: p => this.penNames.set(u.id, p.penName || `${u.firstName} ${u.lastName}`),
        error: () => this.penNames.set(u.id, `${u.firstName} ${u.lastName}`),
      });
    }
  }

  penName(u: UserProfileDto): string {
    return this.penNames.get(u.id) ?? `${u.firstName} ${u.lastName}`;
  }

  goPage(delta: number): void {
    const next = this.page + delta;
    if (next < 0 || next >= this.totalPages) return;
    this.page = next;
    this.loadList();
  }

  selectAuthor(user: UserProfileDto): void {
    if (this.selected?.id === user.id) return;
    this.clearBanner();
    this.detailTab = 'profile';
    this.selected = user;
    this.patchProfileForm(user);
    this.authorWorks = [];
    this.loadDetail(user.id);
  }

  switchTab(tab: 'profile' | 'works'): void {
    this.detailTab = tab;
    if (tab === 'works' && this.selected && this.authorWorks.length === 0 && !this.loadingWorks) {
      this.loadWorks(this.selected.id);
    }
  }

  private patchProfileForm(u: UserProfileDto): void {
    this.profileForm.patchValue({
      firstName: u.firstName,
      lastName: u.lastName,
      bio: u.bio ?? '',
      avatarUrl: u.avatarUrl ?? '',
      preferredLanguage: u.preferredLanguage ?? '',
      newsletter: u.newsletter,
    });
  }

  private loadDetail(userId: string): void {
    this.loadingDetail = true;
    this.adminUsers
      .getById(userId)
      .pipe(finalize(() => (this.loadingDetail = false)))
      .subscribe({
        next: u => {
          this.selected = u;
          this.patchProfileForm(u);
          this.mergeAuthorInList(u);
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de charger le détail auteur.' };
        },
      });

    if (!this.penNames.has(userId)) {
      this.authorService.getProfile(userId).subscribe({
        next: p => this.penNames.set(userId, p.penName || 'Auteur'),
        error: () => {
          if (this.selected) {
            this.penNames.set(userId, `${this.selected.firstName} ${this.selected.lastName}`);
          }
        },
      });
    }
  }

  private loadWorks(authorId: string): void {
    this.loadingWorks = true;
    this.worksError = null;
    this.adminCatalog
      .listBooks({ authorId, size: 50, sort: 'createdAt,desc' })
      .pipe(finalize(() => (this.loadingWorks = false)))
      .subscribe({
        next: res => (this.authorWorks = res.content),
        error: () => {
          this.worksError = 'Impossible de charger les œuvres.';
          this.authorWorks = [];
        },
      });
  }

  private mergeAuthorInList(u: UserProfileDto): void {
    const idx = this.authors.findIndex(x => x.id === u.id);
    if (idx >= 0) this.authors[idx] = u;
  }

  saveProfile(): void {
    if (!this.selected || this.profileForm.invalid || this.busyProfile) return;
    this.busyProfile = true;
    const v = this.profileForm.getRawValue();
    this.adminUsers
      .updateProfile(this.selected.id, {
        firstName: v.firstName!.trim(),
        lastName: v.lastName!.trim(),
        bio: v.bio?.trim() ? v.bio.trim() : null,
        avatarUrl: v.avatarUrl?.trim() ? v.avatarUrl.trim() : null,
        preferredLanguage: v.preferredLanguage?.trim() ? v.preferredLanguage.trim() : null,
        newsletter: !!v.newsletter,
      })
      .pipe(finalize(() => (this.busyProfile = false)))
      .subscribe({
        next: u => {
          this.selected = u;
          this.mergeAuthorInList(u);
          this.banner = { kind: 'success', text: 'Profil mis à jour.' };
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Échec de la mise à jour du profil.' };
        },
      });
  }

  toggleActive(): void {
    if (!this.selected || this.busyActive) return;
    if (this.selected.id === this.currentAdminId && this.selected.active) {
      this.banner = { kind: 'info', text: 'Vous ne pouvez pas suspendre votre propre compte.' };
      return;
    }
    const next = !this.selected.active;
    this.busyActive = true;
    this.adminUsers
      .setActive(this.selected.id, next)
      .pipe(finalize(() => (this.busyActive = false)))
      .subscribe({
        next: u => {
          this.selected = u;
          this.mergeAuthorInList(u);
          this.banner = {
            kind: 'success',
            text: u.active ? 'Compte auteur réactivé.' : 'Compte auteur suspendu.',
          };
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de modifier le statut du compte.' };
        },
      });
  }

  coverUrl(book: BookListItemDto): string {
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

  initials(u: UserProfileDto): string {
    const a = (u.firstName?.[0] ?? '').toUpperCase();
    const b = (u.lastName?.[0] ?? '').toUpperCase();
    return (a + b) || '?';
  }
}
