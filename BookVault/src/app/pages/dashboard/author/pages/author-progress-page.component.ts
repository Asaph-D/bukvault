import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-author-progress-page',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mb-8 dash-animate-in">
      <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white">
        Avancement (mots)
      </h1>
      <p class="text-slate-600 dark:text-zinc-400 mt-1 text-sm">Suivi détaillé de votre production.</p>
    </header>
    <div class="dash-glass p-6">
      <div class="flex items-end gap-1 h-48 px-2">
        <div
          *ngFor="let h of wordBars"
          class="flex-1 rounded-t bg-gradient-to-t from-violet-900/40 to-violet-500/80 min-h-[4px] transition-all hover:to-fuchsia-400"
          [style.height.%]="h"
        ></div>
      </div>
      <p class="text-xs text-slate-500 dark:text-zinc-400 mt-4 text-center">30 derniers jours · tendance positive</p>
    </div>
    <a routerLink="/dashboard/author/home" class="mt-6 inline-block text-sm text-violet-600 dark:text-violet-400 hover:underline">← Vue d’ensemble</a>
  `,
})
export class AuthorProgressPageComponent {
  wordBars = [22, 28, 35, 40, 48, 55, 62, 58, 70, 78, 85, 92];
}
