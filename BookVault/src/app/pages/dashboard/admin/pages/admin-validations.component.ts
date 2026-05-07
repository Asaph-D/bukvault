import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface PendingBookRow {
  id: string;
  title: string;
  author: string;
  submitted: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-validations',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-[family-name:var(--font-display)]">
        Validations en attente
        <span class="ml-2 text-base font-normal text-slate-500 dark:text-slate-400">({{ pendingRows.length }})</span>
      </h1>
      <a routerLink="/dashboard/admin/home" class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2 inline-block">← Vue d'ensemble</a>
    </header>

    <div class="dash-glass p-6 scroll-mt-24">
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead>
            <tr class="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
              <th class="pb-3 pr-4">Livre</th>
              <th class="pb-3 pr-4">Auteur</th>
              <th class="pb-3 pr-4">Soumis</th>
              <th class="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of pendingRows" class="border-b border-slate-100 dark:border-white/5">
              <td class="py-3 pr-4 text-slate-900 dark:text-white">{{ row.title }}</td>
              <td class="py-3 pr-4 text-slate-600 dark:text-slate-400">{{ row.author }}</td>
              <td class="py-3 pr-4 text-slate-500 dark:text-zinc-400">{{ row.submitted }}</td>
              <td class="py-3 text-right whitespace-nowrap">
                <button type="button" class="text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 mr-3 text-xs">Aperçu</button>
                <button
                  type="button"
                  class="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mr-3 text-xs"
                  (click)="approve(row)"
                >
                  Approuver
                </button>
                <button
                  type="button"
                  class="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 text-xs"
                  (click)="reject(row)"
                >
                  Refuser
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminValidationsComponent {
  pendingRows: PendingBookRow[] = [
    { id: '1', title: 'Les Brumes du nord', author: 'M. Keller', submitted: '12/05' },
    { id: '2', title: 'Manuscrit sans titre', author: 'A. Dubois', submitted: '11/05' },
    { id: '3', title: 'Atlas des vents', author: 'S. Lin', submitted: '10/05' },
  ];

  approve(row: PendingBookRow): void {
    this.pendingRows = this.pendingRows.filter(r => r.id !== row.id);
  }

  reject(row: PendingBookRow): void {
    this.pendingRows = this.pendingRows.filter(r => r.id !== row.id);
  }
}
