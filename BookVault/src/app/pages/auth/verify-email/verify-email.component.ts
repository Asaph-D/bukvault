import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-verify-email',
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950 px-4">
      <div class="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8 text-center">
        <div *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">
          <i class="fas fa-spinner fa-spin text-2xl text-indigo-600 mb-4"></i>
          <p>Validation de votre adresse e-mail…</p>
        </div>
        <ng-container *ngIf="!loading && success">
          <i class="fas fa-check-circle text-4xl text-emerald-500 mb-4"></i>
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">E-mail confirmé</h1>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{{ message }}</p>
          <a
            [routerLink]="['/auth/login']"
            class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:brightness-110"
          >
            Se connecter
          </a>
        </ng-container>
        <ng-container *ngIf="!loading && !success">
          <i class="fas fa-times-circle text-4xl text-red-500 mb-4"></i>
          <h1 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Lien invalide</h1>
          <p class="text-sm text-zinc-600 dark:text-zinc-400 mb-6">{{ message }}</p>
          <a
            [routerLink]="['/auth/verify-email-pending']"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Renvoyer un e-mail de vérification
          </a>
        </ng-container>
      </div>
    </div>
    <app-footer></app-footer>
  `,
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Jeton de vérification manquant.';
      return;
    }
    this.auth.verifyEmail(token).subscribe({
      next: msg => {
        this.loading = false;
        this.success = true;
        this.message = msg;
      },
      error: err => {
        this.loading = false;
        this.success = false;
        this.message = err.message || 'Impossible de valider ce lien.';
      },
    });
  }
}
