import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <app-header></app-header>
    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12 max-w-3xl">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-6">Contact</h1>
        <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-4 text-sm sm:text-base">
          Pour toute question sur la plateforme ou les microservices du projet, référez-vous à l’équipe ou au dépôt du
          cours.
        </p>
        <p class="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm sm:text-base">
          Un formulaire de contact utilisateur pourra être ajouté lorsque le backend exposera une route dédiée.
        </p>
      </div>
    </div>
    <app-footer></app-footer>
  `
})
export class ContactComponent {}
