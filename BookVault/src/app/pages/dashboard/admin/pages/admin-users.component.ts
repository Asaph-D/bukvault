import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { AdminUsersService } from '../../../../services/admin-users.service';
import { AuthService } from '../../../../services/auth.service';
import {
  ReaderSettingsDto,
  UpdateReaderSettingsRequest,
  UserProfileDto,
} from '../../../../models/api.types';

type BannerKind = 'success' | 'danger' | 'info';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardInternalHeaderComponent,
  ],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit, OnDestroy {
  private readonly sub = new Subscription();
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  loadingList = false;
  loadingDetail = false;
  listError: string | null = null;

  users: UserProfileDto[] = [];
  totalElements = 0;
  totalPages = 0;
  page = 0;
  pageSize = 15;

  filterActive: 'all' | 'true' | 'false' = 'all';
  searchQuery = '';

  selected: UserProfileDto | null = null;
  readerSettings: ReaderSettingsDto | null = null;
  detailTab: 'profile' | 'settings' = 'profile';

  banner: { kind: BannerKind; text: string } | null = null;

  busyActive = false;
  busyProfile = false;
  busySettings = false;

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

  get filteredUsers(): UserProfileDto[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u => {
      const hay = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase();
      return hay.includes(q);
    });
  }

  get activeCountOnPage(): number {
    return this.users.filter(u => u.active).length;
  }

  clearBanner(): void {
    this.banner = null;
  }

  onSearchInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      /* filtre client sur la page courante */
    }, 200);
  }

  applyFilters(): void {
    this.page = 0;
    this.selected = null;
    this.readerSettings = null;
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
        role: 'USER',
        active: activeParam,
        sort: 'createdAt,desc',
      })
      .pipe(finalize(() => (this.loadingList = false)))
      .subscribe({
        next: res => {
          this.users = res.content;
          this.totalElements = res.totalElements;
          this.totalPages = res.totalPages;
          this.page = res.number;
          if (this.selected && !this.users.some(u => u.id === this.selected!.id)) {
            this.selected = null;
            this.readerSettings = null;
          }
        },
        error: () => {
          this.listError = 'Impossible de charger la liste des lecteurs.';
          this.users = [];
        },
      });
  }

  goPage(delta: number): void {
    const next = this.page + delta;
    if (next < 0 || next >= this.totalPages) return;
    this.page = next;
    this.loadList();
  }

  selectUser(user: UserProfileDto): void {
    if (this.selected?.id === user.id) return;
    this.clearBanner();
    this.detailTab = 'profile';
    this.selected = user;
    this.patchProfileForm(user);
    this.readerSettings = null;
    this.loadDetail(user.id);
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
          this.mergeUserInList(u);
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de charger le détail utilisateur.' };
        },
      });

    this.adminUsers.getReaderSettings(userId).subscribe({
      next: s => (this.readerSettings = s),
      error: () => (this.readerSettings = null),
    });
  }

  private mergeUserInList(u: UserProfileDto): void {
    const idx = this.users.findIndex(x => x.id === u.id);
    if (idx >= 0) this.users[idx] = u;
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
          this.mergeUserInList(u);
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
      this.banner = { kind: 'info', text: 'Vous ne pouvez pas suspendre votre propre compte administrateur.' };
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
          this.mergeUserInList(u);
          this.banner = {
            kind: 'success',
            text: u.active ? 'Compte réactivé.' : 'Compte suspendu.',
          };
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de modifier le statut du compte.' };
        },
      });
  }

  saveReaderSettingToggle(field: keyof UpdateReaderSettingsRequest, value: boolean): void {
    if (!this.selected || !this.readerSettings || this.busySettings) return;
    const body: UpdateReaderSettingsRequest = {
      theme: this.readerSettings.theme,
      uiDensity: this.readerSettings.uiDensity,
      localeOverride: this.readerSettings.localeOverride,
      notifyOrders: this.readerSettings.notifyOrders,
      notifyPromotions: this.readerSettings.notifyPromotions,
      notifySocial: this.readerSettings.notifySocial,
      communityVisibility: this.readerSettings.communityVisibility,
      allowDirectMessages: this.readerSettings.allowDirectMessages,
      readerHomeDefault: this.readerSettings.readerHomeDefault,
      libraryShowProgress: this.readerSettings.libraryShowProgress,
      reduceMotion: this.readerSettings.reduceMotion,
      [field]: value,
    };
    this.busySettings = true;
    this.adminUsers
      .updateReaderSettings(this.selected.id, body)
      .pipe(finalize(() => (this.busySettings = false)))
      .subscribe({
        next: s => {
          this.readerSettings = s;
          this.banner = { kind: 'success', text: 'Préférences lecteur mises à jour.' };
        },
        error: () => {
          this.banner = { kind: 'danger', text: 'Impossible de mettre à jour les préférences.' };
        },
      });
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
