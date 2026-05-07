import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12 max-w-3xl">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-6">À propos</h1>
        <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 text-sm sm:text-base">
          BookVault est une vitrine et une boutique pour livres numériques et physiques, branchée sur une architecture
          microservices (gateway, catalogue, commandes, auteurs, etc.).
        </p>
        <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
          Cette page est une coquille pour la navigation ; le contenu éditorial pourra être enrichi plus tard.
        </p>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class AboutComponent {}
