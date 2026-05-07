import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-slate-100 text-slate-700 dark:bg-gray-900 dark:text-gray-300 py-12 px-4 transition-colors">
      <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <a href="#" class="flex items-center mb-4">
              <i class="fas fa-book-open text-2xl text-blue-800 dark:text-sky-400 mr-2"></i>
              <span class="text-xl font-bold text-slate-900 dark:text-white">BookVault</span>
            </a>
            <p class="mb-4 text-slate-600 dark:text-gray-400">La plateforme de référence pour les auteurs indépendants et les amateurs de littérature.</p>
            <div class="flex space-x-4">
              <a href="#" class="text-slate-500 hover:text-blue-800 dark:text-gray-400 dark:hover:text-white transition"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="text-slate-500 hover:text-blue-800 dark:text-gray-400 dark:hover:text-white transition"><i class="fab fa-twitter"></i></a>
              <a href="#" class="text-slate-500 hover:text-blue-800 dark:text-gray-400 dark:hover:text-white transition"><i class="fab fa-instagram"></i></a>
              <a href="#" class="text-slate-500 hover:text-blue-800 dark:text-gray-400 dark:hover:text-white transition"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-4 text-slate-900 dark:text-white">Navigation</h3>
            <ul class="space-y-2">
              <li><a [routerLink]="['/']" class="hover:text-blue-800 dark:hover:text-white transition">Accueil</a></li>
              <li><a [routerLink]="['/categories']" class="hover:text-blue-800 dark:hover:text-white transition">Catégories</a></li>
              <li><a [routerLink]="['/bestsellers']" class="hover:text-blue-800 dark:hover:text-white transition">Meilleures Ventes</a></li>
              <li><a [routerLink]="['/authors']" class="hover:text-blue-800 dark:hover:text-white transition">Auteurs</a></li>
              <li><a [routerLink]="['/about']" class="hover:text-blue-800 dark:hover:text-white transition">À propos</a></li>
              <li><a [routerLink]="['/contact']" class="hover:text-blue-800 dark:hover:text-white transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-4 text-slate-900 dark:text-white">Informations</h3>
            <ul class="space-y-2">
              <li><a href="#" class="hover:text-blue-800 dark:hover:text-white transition">Comment ça marche</a></li>
              <li><a href="#" class="hover:text-blue-800 dark:hover:text-white transition">FAQ</a></li>
              <li><a href="#" class="hover:text-blue-800 dark:hover:text-white transition">Conditions d'utilisation</a></li>
              <li><a href="#" class="hover:text-blue-800 dark:hover:text-white transition">Politique de confidentialité</a></li>
              <li><a href="#" class="hover:text-blue-800 dark:hover:text-white transition">Centre d'aide</a></li>
            </ul>
          </div>
          <div>
            <h3 class="text-lg font-bold mb-4 text-slate-900 dark:text-white">Newsletter</h3>
            <p class="mb-4 text-slate-600 dark:text-gray-400">Inscrivez-vous pour recevoir nos actualités et promotions.</p>
            <form>
              <div class="flex">
                <input type="email" placeholder="Votre email" class="px-4 py-2 rounded-l-md w-full focus:outline-none text-gray-800 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 border border-slate-200 dark:border-slate-600">
                <button type="submit" class="bg-blue-800 dark:bg-sky-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-900 dark:hover:bg-sky-500 transition">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
        <div class="border-t border-slate-200 dark:border-gray-800 mt-8 pt-8 text-center text-slate-600 dark:text-gray-400">
          <p>&copy; 2026 BookVault. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}