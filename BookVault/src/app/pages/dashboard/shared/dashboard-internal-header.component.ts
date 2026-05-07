import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * En-tête interne commun aux pages du tableau de bord : bandeau titre + sous-titre + slot actions.
 */
@Component({
  standalone: true,
  selector: 'app-dashboard-internal-header',
  imports: [CommonModule],
  template: `
    <header class="dash-int-header mb-8 pb-6 border-b border-slate-200/90 dark:border-slate-700/60">
      <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div class="min-w-0 flex-1">
          <p
            *ngIf="eyebrow"
            class="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2"
          >
            {{ eyebrow }}
          </p>
          <h1
            class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white leading-tight"
          >
            {{ title }}
          </h1>
          <p *ngIf="subtitle" class="text-slate-600 dark:text-zinc-400 mt-3 text-sm md:text-[15px] leading-relaxed max-w-3xl">
            {{ subtitle }}
          </p>
          <div *ngIf="badges?.length" class="flex flex-wrap gap-2 mt-4">
            <span
              *ngFor="let b of badges"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-white/10"
            >
              <i *ngIf="b.icon" [class]="b.icon + ' text-[11px] opacity-80'"></i>
              {{ b.label }}
            </span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
    </header>
  `,
})
export class DashboardInternalHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() eyebrow = '';
  @Input() badges: { label: string; icon?: string }[] | null = null;
}
