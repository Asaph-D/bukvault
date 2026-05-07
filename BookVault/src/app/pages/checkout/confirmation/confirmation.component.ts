import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-confirmation',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12">
        <div class="max-w-3xl mx-auto">
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-8 text-center">
            <div class="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-950/80 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-200/80 dark:ring-emerald-800">
              <i class="fas fa-check text-emerald-600 dark:text-emerald-400 text-3xl"></i>
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Commande confirmée !</h1>
            <p class="text-zinc-600 dark:text-zinc-400 mb-6">Merci pour votre achat. Votre commande a été traitée avec succès.</p>
            
            <div class="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700 p-6 rounded-xl mb-6 text-left">
              <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Détails de la commande</h2>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Numéro de commande :</span>
                <span class="font-medium text-slate-900 dark:text-white">CMD-{{ orderNumber }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Date :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ orderDate | date:'longDate' }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Email :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ email }}</span>
              </div>
              
              <div class="flex justify-between mb-2">
                <span class="text-zinc-600 dark:text-zinc-400">Montant :</span>
                <span class="font-semibold text-slate-900 dark:text-white">{{ total | currency:'EUR' }}</span>
              </div>
              
              <div class="flex justify-between">
                <span class="text-zinc-600 dark:text-zinc-400">Méthode de paiement :</span>
                <span class="text-slate-900 dark:text-slate-100">{{ paymentMethod }}</span>
              </div>
            </div>
            
            <div class="mb-6 text-left">
              <h3 class="font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-3">Articles achetés</h3>
              <div class="space-y-3">
                <div *ngFor="let item of items" class="flex items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                  <img [src]="item.image" [alt]="item.title" class="w-12 h-16 object-cover rounded-sm mr-3 ring-1 ring-slate-200 dark:ring-slate-600">
                  <div class="flex-1 text-left">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ item.title }}</h4>
                    <div class="flex justify-between">
                      <span class="text-zinc-500 dark:text-zinc-400 text-sm">{{ item.quantity }} × {{ item.price | currency:'EUR' }}</span>
                      <span class="font-medium text-slate-900 dark:text-white">{{ item.quantity * item.price | currency:'EUR' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="space-y-2 mb-8 text-zinc-600 dark:text-zinc-400 text-sm">
              <p>Une confirmation a été envoyée à votre adresse email.</p>
              <p>Les livres numériques sont disponibles immédiatement dans votre bibliothèque.</p>
              <p>Les livres physiques seront livrés dans 3 à 5 jours ouvrables.</p>
            </div>
            
            <div class="flex flex-col sm:flex-row justify-center gap-4">
              <a [routerLink]="['/']" class="inline-flex justify-center bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition">
                Retour à l'accueil
              </a>
              <a [routerLink]="['/dashboard/library']" class="inline-flex justify-center border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition">
                Voir ma bibliothèque
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <app-footer></app-footer>
  `,
})
export class ConfirmationComponent {
  orderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  orderDate = new Date();
  email = "demo@bookvault.com";
  total = 71.57;
  paymentMethod = "Visa se terminant par 4242";
  
  items = [
    {
      title: "Le Temps des Étoiles",
      quantity: 1,
      price: 19.99,
      image: "https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg"
    },
    {
      title: "Les Secrets de Paris",
      quantity: 1,
      price: 24.50,
      image: "https://images.pexels.com/photos/5836/yellow-metal-design-decoration.jpg"
    },
    {
      title: "Le Royaume Perdu",
      quantity: 1,
      price: 21.99,
      image: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg"
    }
  ];
}