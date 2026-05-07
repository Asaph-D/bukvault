import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardInternalHeaderComponent } from './dashboard-internal-header.component';

/** Page générique remplie via `data: { title, description, eyebrow? }` sur la route. */
@Component({
  standalone: true,
  selector: 'app-dashboard-route-page',
  imports: [CommonModule, RouterLink, DashboardInternalHeaderComponent],
  template: `
    <div class="dash-animate-in max-w-4xl">
      <app-dashboard-internal-header
        [title]="title"
        [subtitle]="description"
        [eyebrow]="eyebrow"
        [badges]="badges"
      >
        <a
          actions
          routerLink=".."
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/15 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-white/10 transition"
        >
          <i class="fas fa-arrow-left text-xs opacity-70"></i>
          Retour
        </a>
      </app-dashboard-internal-header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="dash-glass p-5 rounded-xl border border-slate-200/80 dark:border-white/10">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Maquette
          </p>
          <p class="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed">
            Cette page est câblée au routage du tableau de bord. Le contenu ci‑dessous sert de guide visuel avant
            branchement API.
          </p>
        </div>
        <div class="dash-glass p-5 rounded-xl border border-slate-200/80 dark:border-white/10 md:col-span-2">
          <p class="text-xs font-semibold text-slate-500 dark:text-zinc-400 mb-3">Intégrations prévues</p>
          <ul class="space-y-2 text-sm text-slate-700 dark:text-zinc-300">
            <li class="flex gap-2 items-start">
              <i class="fas fa-plug text-emerald-500 dark:text-emerald-400 mt-0.5 text-xs"></i>
              <span>Appels REST / GraphQL et gestion des erreurs réseau</span>
            </li>
            <li class="flex gap-2 items-start">
              <i class="fas fa-shield-alt text-sky-500 dark:text-sky-400 mt-0.5 text-xs"></i>
              <span>Jeton JWT et contrôle des rôles côté garde de route</span>
            </li>
            <li class="flex gap-2 items-start">
              <i class="fas fa-bell text-amber-500 dark:text-amber-400 mt-0.5 text-xs"></i>
              <span>Retours utilisateur : états de chargement, listes vides, confirmations</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="dash-glass p-6 rounded-xl border border-dashed border-slate-300/90 dark:border-white/20">
        <p class="flex items-start gap-3 text-sm text-slate-700 dark:text-zinc-300">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/12 dark:bg-indigo-400/15 text-indigo-600 dark:text-indigo-300"
          >
            <i class="fas fa-layer-group"></i>
          </span>
          <span>
            Placez ici les composants métier (tableaux, formulaires, lecteurs média). Les données mock peuvent vivre
            dans le composant jusqu’au branchement sur le backend.
          </span>
        </p>
      </div>
    </div>
  `,
})
export class DashboardRoutePageComponent implements OnInit {
  title = '';
  description = '';
  eyebrow = '';
  badges: { label: string; icon?: string }[] | null = [
    { label: 'Design system', icon: 'fas fa-palette' },
    { label: 'Stub UI', icon: 'fas fa-cube' },
  ];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.data.subscribe(d => {
      this.title = (d['title'] as string) || 'Page';
      this.description = (d['description'] as string) || '';
      this.eyebrow = (d['eyebrow'] as string) || '';
      const customBadges = d['badges'] as { label: string; icon?: string }[] | undefined;
      this.badges = customBadges?.length
        ? customBadges
        : [
            { label: 'Design system', icon: 'fas fa-palette' },
            { label: 'Stub UI', icon: 'fas fa-cube' },
          ];
    });
  }
}
