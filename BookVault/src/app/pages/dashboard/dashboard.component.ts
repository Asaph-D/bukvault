import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  host: {
    class: 'block min-h-0',
  },
  imports: [CommonModule, RouterModule, HeaderComponent],
  template: `
    <app-header />
    <div
      *ngIf="loading"
      class="min-h-[50vh] pt-app-header flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950"
    >
      <div class="text-center">
        <i class="fas fa-circle-notch fa-spin text-2xl text-violet-600 dark:text-violet-500 mb-3"></i>
        <p>Chargement de votre espace…</p>
      </div>
    </div>

    <div
      *ngIf="!loading && user"
      class="pt-app-header box-border flex min-h-0 flex-col overflow-x-hidden md:h-screen md:max-h-screen md:overflow-hidden"
    >
      <router-outlet />
    </div>

    <div
      *ngIf="!loading && !user"
      class="min-h-[50vh] pt-app-header flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 px-4"
    >
      <p class="mb-4">Session introuvable. Veuillez vous reconnecter.</p>
      <a routerLink="/auth/login" class="text-violet-600 dark:text-violet-400 hover:underline">Connexion</a>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  loading = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(u => {
      this.user = u;
      if (u) {
        this.loading = false;
        return;
      }
      if (!this.authService.isAuthenticated()) {
        this.loading = false;
      }
    });
  }
}
