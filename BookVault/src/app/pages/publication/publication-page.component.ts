import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PublicationSheetComponent, PublicationSheetMode } from '../../shared/publication-sheet/publication-sheet.component';

@Component({
  standalone: true,
  selector: 'app-publication-page',
  imports: [CommonModule, RouterModule, PublicationSheetComponent],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#12121a] text-slate-900 dark:text-zinc-100">
      <header class="border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-[#12121a]/90 backdrop-blur-md">
        <div class="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-2 shrink-0">
            <img src="assets/branding/bookvaulticon.png" alt="" class="h-9 w-9 rounded-lg" />
            <span class="font-semibold font-[family-name:var(--font-display)]">BookVault</span>
          </a>
          <a
            routerLink="/books"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Catalogue
          </a>
        </div>
      </header>

      <main class="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <p class="text-xs uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-2">Fiche de publication</p>
        <h1 class="text-2xl md:text-3xl font-semibold font-[family-name:var(--font-display)] mb-8">
          {{ pageTitle }}
        </h1>
        <app-publication-sheet [bookId]="bookId" [mode]="mode" />
      </main>
    </div>
  `,
})
export class PublicationPageComponent {
  bookId = '';
  mode: PublicationSheetMode = 'auto';

  constructor(private route: ActivatedRoute) {
    this.bookId = this.route.snapshot.paramMap.get('bookId') ?? '';
    const view = this.route.snapshot.queryParamMap.get('view');
    if (view === 'pending') this.mode = 'pending';
    else if (view === 'published') this.mode = 'published';
  }

  get pageTitle(): string {
    return this.mode === 'pending' ? 'Manuscrit en validation' : 'Ouvrage publié';
  }
}
