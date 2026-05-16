import { Component } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DashboardInternalHeaderComponent } from '../../shared/dashboard-internal-header.component';
import { PublicationSheetComponent } from '../../../../shared/publication-sheet/publication-sheet.component';

/** Wrapper dashboard — réutilise la fiche partagée publique. */
@Component({
  standalone: true,
  selector: 'app-author-publication-sheet',
  imports: [RouterModule, DashboardInternalHeaderComponent, PublicationSheetComponent],
  template: `
    <app-dashboard-internal-header
      title="Fiche de publication"
      eyebrow="Espace auteur"
      subtitle="Fiche partagée — visible publiquement une fois le titre validé."
      [badges]="[
        { label: 'Publication', icon: 'fas fa-book-open' },
        { label: 'Partagée', icon: 'fas fa-share-alt' }
      ]"
    >
      <a
        actions
        [routerLink]="['/publication', bookId]"
        target="_blank"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-white/15 bg-white/90 dark:bg-white/5 text-slate-800 dark:text-zinc-100 hover:bg-slate-50 dark:hover:bg-white/10 transition"
      >
        <i class="fas fa-external-link-alt text-xs"></i>
        Ouvrir la fiche publique
      </a>
    </app-dashboard-internal-header>
    <div class="dash-animate-in">
      <app-publication-sheet [bookId]="bookId" mode="auto" />
    </div>
  `,
})
export class AuthorPublicationSheetComponent {
  bookId = '';

  constructor(route: ActivatedRoute) {
    this.bookId = route.snapshot.paramMap.get('bookId') ?? '';
  }
}
