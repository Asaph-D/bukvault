import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { AccountSecurityService } from '../../../../services/account-security.service';
import { UserAccountService } from '../../../../services/user-account.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  standalone: true,
  selector: 'app-reader-settings',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, DashboardInternalHeaderComponent],
  templateUrl: './reader-settings.component.html',
})
export class ReaderSettingsComponent implements OnDestroy {
  private readonly sub = new Subscription();

  userId: string | null = null;

  busyPassword = false;
  busyLogoutAll = false;
  busyDeactivate = false;

  banner: { kind: 'success' | 'danger' | 'info'; text: string } | null = null;

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', [Validators.required]],
  });

  // “actions dangereuses” : double validation
  confirmLogoutAll = false;
  confirmDeactivate = '';
  confirmDeactivateChecked = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private security: AccountSecurityService,
    private account: UserAccountService,
    private notifications: NotificationService,
    private router: Router
  ) {
    this.sub.add(
      this.auth.currentUser$.subscribe(u => {
        this.userId = u?.id ?? null;
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  clearBanner(): void {
    this.banner = null;
  }

  get passwordMismatch(): boolean {
    const v = this.passwordForm.getRawValue();
    return !!v.newPassword && !!v.confirmPassword && v.newPassword !== v.confirmPassword;
  }

  changePassword(): void {
    this.clearBanner();
    if (this.busyPassword) return;
    if (this.passwordForm.invalid || this.passwordMismatch) return;

    const v = this.passwordForm.getRawValue();
    this.busyPassword = true;
    this.security
      .changePassword({
        currentPassword: v.currentPassword!,
        newPassword: v.newPassword!,
      })
      .subscribe({
        next: () => {
          this.banner = {
            kind: 'success',
            text: 'Mot de passe mis à jour. Pour votre sécurité, toutes vos sessions ont été déconnectées.',
          };
          this.passwordForm.reset();
          this.confirmLogoutAll = false;
          // côté backend: sessions révoquées, on force une déconnexion locale propre
          this.auth.logout();
          this.router.navigate(['/auth/login']);
        },
        error: (e: unknown) => {
          const msg = (e as { message?: string })?.message || 'Impossible de changer le mot de passe.';
          this.banner = { kind: 'danger', text: msg };
        },
        complete: () => (this.busyPassword = false),
      });
  }

  logoutAllDevices(): void {
    this.clearBanner();
    if (this.busyLogoutAll || !this.confirmLogoutAll) return;
    this.busyLogoutAll = true;
    this.security.revokeAllSessions().subscribe({
      next: res => {
        this.banner = {
          kind: 'success',
          text: `Sessions déconnectées (${res.revokedRefreshTokens}).`,
        };
        this.confirmLogoutAll = false;
        this.auth.logout();
        this.router.navigate(['/auth/login']);
      },
      error: () => {
        this.banner = { kind: 'danger', text: 'Impossible de déconnecter toutes les sessions.' };
      },
      complete: () => (this.busyLogoutAll = false),
    });
  }

  markAllNotificationsRead(): void {
    this.clearBanner();
    this.notifications.markAllAsRead().subscribe({
      next: () => {
        this.banner = { kind: 'success', text: 'Toutes les notifications ont été marquées comme lues.' };
      },
      error: () => {
        this.banner = { kind: 'danger', text: 'Impossible de mettre à jour les notifications.' };
      },
    });
  }

  deactivateAccount(): void {
    this.clearBanner();
    if (this.busyDeactivate) return;
    if (!this.userId) {
      this.banner = { kind: 'danger', text: 'Session introuvable.' };
      return;
    }
    const token = (this.confirmDeactivate || '').trim().toUpperCase();
    if (!this.confirmDeactivateChecked || token !== 'SUPPRIMER') {
      this.banner = { kind: 'info', text: 'Veuillez confirmer en cochant la case et en tapant “SUPPRIMER”.' };
      return;
    }
    this.busyDeactivate = true;
    this.account.deactivateAccount(this.userId).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/']);
      },
      error: () => {
        this.banner = { kind: 'danger', text: 'Impossible de désactiver le compte.' };
      },
      complete: () => (this.busyDeactivate = false),
    });
  }
}

