import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

/** Placeholder : le formulaire auteur devra appeler POST /api/v1/books avec JWT AUTHOR. */
@Component({
  selector: 'app-upload-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12 max-w-2xl">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Publier un livre</h1>
        <p class="text-zinc-700 dark:text-zinc-300 mb-6 text-sm sm:text-base">
          L’interface d’upload n’est pas encore branchée sur le catalogue. L’API attend un appel
          <code class="bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-slate-100 px-1.5 py-0.5 rounded text-xs">POST /api/v1/books</code> avec un token au rôle AUTHOR ou ADMIN.
        </p>
        <a routerLink="/dashboard" class="text-indigo-600 dark:text-indigo-400 underline text-sm">Retour au tableau de bord</a>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class UploadPlaceholderComponent {}
