import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';
import { ReaderUiPrefsService } from '../../../services/reader-ui-prefs.service';
import { UserAccountService } from '../../../services/user-account.service';
import {
  ReaderSettingsDto,
  UpdateReaderSettingsRequest,
  UpdateUserProfileRequest,
  UserProfileDto,
} from '../../../models/api.types';
import { DashboardInternalHeaderComponent } from './dashboard-internal-header.component';

export type DashboardProfileVariant = 'reader' | 'author' | 'admin';

@Component({
  standalone: true,
  selector: 'app-dashboard-account-profile',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DashboardInternalHeaderComponent],
  templateUrl: './dashboard-account-profile.component.html',
})
export class DashboardAccountProfileComponent implements OnInit, OnDestroy {
  variant: DashboardProfileVariant = 'reader';

  profileForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    bio: [''],
    avatarUrl: [''],
    preferredLanguage: ['fr'],
    newsletter: [false],
  });

  settingsForm = this.fb.group({
    theme: this.fb.nonNullable.control<'LIGHT' | 'DARK' | 'SYSTEM'>('SYSTEM'),
    uiDensity: this.fb.nonNullable.control<'COMFORTABLE' | 'COMPACT'>('COMFORTABLE'),
    localeOverride: [''],
    notifyOrders: [true],
    notifyPromotions: [false],
    notifySocial: [true],
    communityVisibility: this.fb.nonNullable.control<'PUBLIC' | 'MEMBERS_ONLY' | 'PRIVATE'>('PUBLIC'),
    allowDirectMessages: [true],
    readerHomeDefault: this.fb.nonNullable.control<'OVERVIEW' | 'CONTINUE' | 'DISCOVER'>('OVERVIEW'),
    libraryShowProgress: [true],
    reduceMotion: [false],
  });

  loading = true;
  saveProfileBusy = false;
  saveSettingsBusy = false;
  loadError: string | null = null;
  saveProfileMsg: string | null = null;
  saveSettingsMsg: string | null = null;

  profileSnapshot: UserProfileDto | null = null;
  settingsSnapshot: ReaderSettingsDto | null = null;

  private sub = new Subscription();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private auth: AuthService,
    private account: UserAccountService,
    private theme: ThemeService,
    private uiPrefs: ReaderUiPrefsService
  ) {}

  ngOnInit(): void {
    const v = this.route.snapshot.data['profileVariant'];
    if (v === 'reader' || v === 'author' || v === 'admin') {
      this.variant = v;
    }
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get headerEyebrow(): string {
    switch (this.variant) {
      case 'author':
        return 'Mon espace auteur';
      case 'admin':
        return 'Administration';
      default:
        return 'Mon compte';
    }
  }

  get headerTitle(): string {
    switch (this.variant) {
      case 'author':
        return 'Profil & préférences';
      case 'admin':
        return 'Mon profil';
      default:
        return 'Profil & préférences';
    }
  }

  get headerSubtitle(): string {
    switch (this.variant) {
      case 'author':
        return 'Mettez à jour votre identité publique et la façon dont BookVault vous accompagne au quotidien.';
      case 'admin':
        return 'Informations personnelles et confort d’affichage pour votre session d’administration.';
      default:
        return 'Votre identité sur BookVault et les réglages qui suivent votre navigation.';
    }
  }

  get profileSectionHint(): string {
    switch (this.variant) {
      case 'author':
        return 'Présenté aux lecteurs sur vos livres et lors de vos échanges.';
      case 'admin':
        return 'Associées à votre compte administrateur.';
      default:
        return 'Visible sur la boutique, la communauté et vos messages.';
    }
  }

  get moreLinks(): { label: string; link: string; hint: string }[] {
    switch (this.variant) {
      case 'author':
        return [
          { label: 'Mes œuvres', link: '/dashboard/author/works', hint: 'Vos titres publiés' },
          { label: 'Messages', link: '/dashboard/author/messages', hint: 'Échanges avec les lecteurs' },
          { label: 'Paramètres auteur', link: '/dashboard/author/settings', hint: 'Versements et options du compte' },
        ];
      case 'admin':
        return [
          { label: 'Utilisateurs', link: '/dashboard/admin/users', hint: 'Gestion des comptes' },
          { label: 'Paramètres plateforme', link: '/dashboard/admin/settings', hint: 'Configuration générale' },
        ];
      default:
        return [
          { label: 'Goûts & préférences', link: '/dashboard/reader/preferences', hint: 'Genres et langues de lecture' },
          { label: 'Paramètres', link: '/dashboard/reader/settings', hint: 'Sécurité et confidentialité' },
          { label: 'Messages', link: '/dashboard/reader/messages', hint: 'Boîte de réception' },
          { label: 'Hub communauté', link: '/dashboard/reader/community', hint: 'Discussions et passionnés' },
        ];
    }
  }

  private loadAll(): void {
    const user = this.auth.getCurrentUser();
    if (!user?.id) {
      this.loading = false;
      this.loadError = 'Connectez-vous pour gérer votre profil.';
      return;
    }
    this.loading = true;
    this.loadError = null;
    this.sub.add(
      forkJoin({
        profile: this.account.getProfile(user.id).pipe(
          catchError(() =>
            this.account.bootstrapProfile().pipe(switchMap(() => this.account.getProfile(user.id)))
          )
        ),
        settings: this.account.getReaderSettings(user.id),
      })
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: ({ profile, settings }) => {
            this.profileSnapshot = profile;
            this.settingsSnapshot = settings;
            this.profileForm.patchValue({
              firstName: profile.firstName,
              lastName: profile.lastName,
              bio: profile.bio ?? '',
              avatarUrl: profile.avatarUrl ?? '',
              preferredLanguage: profile.preferredLanguage ?? 'fr',
              newsletter: profile.newsletter,
            });
            this.settingsForm.patchValue({
              theme: settings.theme,
              uiDensity: settings.uiDensity,
              localeOverride: settings.localeOverride ?? '',
              notifyOrders: settings.notifyOrders,
              notifyPromotions: settings.notifyPromotions,
              notifySocial: settings.notifySocial,
              communityVisibility: settings.communityVisibility,
              allowDirectMessages: settings.allowDirectMessages,
              readerHomeDefault: settings.readerHomeDefault,
              libraryShowProgress: settings.libraryShowProgress,
              reduceMotion: settings.reduceMotion,
            });
          },
          error: (err: HttpErrorResponse) => {
            this.loadError =
              err?.error?.detail || err?.error?.message || err.message || 'Impossible de charger le profil.';
          },
        })
    );
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.saveProfileBusy) return;
    const user = this.auth.getCurrentUser();
    if (!user?.id) return;
    const v = this.profileForm.getRawValue();
    const body: UpdateUserProfileRequest = {
      firstName: v.firstName!.trim(),
      lastName: v.lastName!.trim(),
      bio: v.bio?.trim() || null,
      avatarUrl: v.avatarUrl?.trim() || null,
      preferredLanguage: v.preferredLanguage?.trim() || null,
      newsletter: !!v.newsletter,
    };
    this.saveProfileBusy = true;
    this.saveProfileMsg = null;
    this.sub.add(
      this.account.updateProfile(user.id, body).pipe(finalize(() => (this.saveProfileBusy = false))).subscribe({
        next: p => {
          this.profileSnapshot = p;
          this.saveProfileMsg = 'Modifications enregistrées.';
        },
        error: () => {
          this.saveProfileMsg = 'Enregistrement impossible pour le moment.';
        },
      })
    );
  }

  saveSettings(): void {
    if (this.settingsForm.invalid || this.saveSettingsBusy) return;
    const user = this.auth.getCurrentUser();
    if (!user?.id) return;
    const v = this.settingsForm.getRawValue();
    const body: UpdateReaderSettingsRequest = {
      theme: v.theme,
      uiDensity: v.uiDensity,
      localeOverride: v.localeOverride?.trim() ? v.localeOverride.trim().toLowerCase() : null,
      notifyOrders: !!v.notifyOrders,
      notifyPromotions: !!v.notifyPromotions,
      notifySocial: !!v.notifySocial,
      communityVisibility: v.communityVisibility,
      allowDirectMessages: !!v.allowDirectMessages,
      readerHomeDefault: v.readerHomeDefault,
      libraryShowProgress: !!v.libraryShowProgress,
      reduceMotion: !!v.reduceMotion,
    };
    this.saveSettingsBusy = true;
    this.saveSettingsMsg = null;
    this.sub.add(
      this.account
        .updateReaderSettings(user.id, body)
        .pipe(finalize(() => (this.saveSettingsBusy = false)))
        .subscribe({
          next: s => {
            this.settingsSnapshot = s;
            this.theme.applyReaderApiPreference(s.theme);
            this.uiPrefs.applyFromDto(s);
            this.saveSettingsMsg = 'Préférences enregistrées.';
          },
          error: () => {
            this.saveSettingsMsg = 'Enregistrement impossible pour le moment.';
          },
        })
    );
  }
}
