import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { CartService, CartLineUi } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { BookService } from '../../../services/book.service';
import { Book } from '../../../models/book.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>

    <div class="pt-app-header bg-gray-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12">
        <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-8">Votre panier</h1>

        <div *ngIf="!auth.isAuthenticated()" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-10 text-center">
          <p class="text-zinc-700 dark:text-zinc-300 mb-6 text-sm">Connectez-vous pour voir votre panier synchronisé avec le service commandes.</p>
          <a [routerLink]="['/auth/login']" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:brightness-110"
            >Connexion</a
          >
        </div>

        <div *ngIf="auth.isAuthenticated()">
          <p *ngIf="loading" class="text-zinc-600 dark:text-zinc-400">Chargement du panier…</p>
          <p *ngIf="loadError" class="text-red-600 dark:text-red-400">{{ loadError }}</p>

          <div *ngIf="!loading && !loadError" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div class="lg:col-span-2">
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Articles ({{ getTotalItems() }})</h2>

                <div class="space-y-4" *ngIf="cartItems.length">
                  <div
                    *ngFor="let item of cartItems"
                    class="flex flex-col md:flex-row border-b border-slate-200 dark:border-slate-700 pb-4 mb-4"
                  >
                    <div class="md:w-24 md:h-32 mb-4 md:mb-0">
                      <img
                        [src]="item.image || placeholder"
                        [alt]="item.title"
                        class="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <div class="md:ml-6 flex-1">
                      <div class="flex justify-between mb-2">
                        <h3 class="font-semibold text-slate-900 dark:text-white">{{ item.title }}</h3>
                        <span class="font-bold">{{ item.lineTotal | currency: 'EUR' }}</span>
                      </div>
                      <p class="text-zinc-500 dark:text-zinc-400 text-sm mb-2">{{ item.author }}</p>
                      <p class="text-zinc-700 dark:text-zinc-300 text-sm mb-4">
                        Format: <span class="font-medium">{{ item.formatLabel }}</span>
                      </p>
                      <div class="flex justify-between items-center">
                        <div class="flex items-center">
                          <button
                            type="button"
                            (click)="updateQuantity(item, -1)"
                            [disabled]="busy"
                            class="w-8 h-8 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
                          >
                            <i class="fas fa-minus text-zinc-600 dark:text-zinc-400"></i>
                          </button>
                          <span class="mx-3">{{ item.quantity }}</span>
                          <button
                            type="button"
                            (click)="updateQuantity(item, 1)"
                            [disabled]="busy"
                            class="w-8 h-8 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-700 transition disabled:opacity-50"
                          >
                            <i class="fas fa-plus text-zinc-600 dark:text-zinc-400"></i>
                          </button>
                        </div>
                        <button
                          type="button"
                          (click)="removeItem(item)"
                          [disabled]="busy"
                          class="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                        >
                          <i class="fas fa-trash-alt mr-1"></i> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div *ngIf="!cartItems.length" class="text-center py-8">
                  <i class="fas fa-shopping-cart text-slate-300 dark:text-zinc-600 text-5xl mb-4"></i>
                  <h3 class="text-zinc-600 dark:text-zinc-400 text-xl mb-2">Votre panier est vide</h3>
                  <p class="text-zinc-500 dark:text-zinc-500 mb-6 text-sm">Ajoutez des livres depuis une fiche livre.</p>
                  <a [routerLink]="['/books']" class="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:brightness-110 transition">
                    Parcourir les livres
                  </a>
                </div>
              </div>

              <div class="flex items-center space-x-4" *ngIf="cartItems.length">
                <a [routerLink]="['/books']" class="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
                  <i class="fas fa-arrow-left mr-2"></i> Continuer les achats
                </a>
              </div>
            </div>

            <div>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Résumé</h2>
                <div class="space-y-3 mb-6">
                  <div class="flex justify-between">
                    <span class="text-zinc-600 dark:text-zinc-400 text-sm">Sous-total ({{ getTotalItems() }} articles)</span>
                    <span>{{ getSubtotal() | currency: 'EUR' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-600 dark:text-zinc-400 text-sm">Livraison</span>
                    <span>{{ shippingCost | currency: 'EUR' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-600 dark:text-zinc-400 text-sm">Taxes</span>
                    <span>{{ getTaxes() | currency: 'EUR' }}</span>
                  </div>
                  <div class="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                    <div class="flex justify-between font-semibold text-slate-900 dark:text-white">
                      <span>Total (indicatif)</span>
                      <span>{{ getTotal() | currency: 'EUR' }}</span>
                    </div>
                  </div>
                </div>

                <a
                  [routerLink]="['/checkout/payment']"
                  class="block w-full bg-indigo-600 text-white text-center px-6 py-3 rounded-lg hover:brightness-110 transition mb-4"
                >
                  Passer à la caisse
                </a>
              </div>

              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6" *ngIf="suggestions.length">
                <h2 class="font-semibold text-slate-900 dark:text-white mb-3">Suggestions</h2>
                <div class="space-y-3">
                  <div *ngFor="let suggestion of suggestions" class="flex items-start">
                    <img
                      [src]="suggestion.coverImage"
                      [alt]="suggestion.title"
                      class="w-12 h-16 object-cover rounded-sm mr-3"
                    />
                    <div class="flex-1">
                      <a [routerLink]="['/books', suggestion.id]" class="font-medium text-sm hover:underline">{{
                        suggestion.title
                      }}</a>
                      <p class="text-zinc-500 dark:text-zinc-400 text-xs">{{ suggestion.author }}</p>
                      <span class="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">{{ suggestion.price | currency: 'EUR' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `
})
export class CartComponent implements OnInit {
  cartItems: CartLineUi[] = [];
  suggestions: Book[] = [];
  loading = false;
  loadError: string | null = null;
  busy = false;
  shippingCost = 4.99;
  taxRate = 0.2;
  placeholder =
    'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg';

  constructor(
    public auth: AuthService,
    private cartService: CartService,
    private bookService: BookService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) return;
    this.reloadCart();
    this.bookService.getBestsellers(5).subscribe({
      next: b => (this.suggestions = b.slice(0, 5)),
      error: () => (this.suggestions = [])
    });
  }

  reloadCart(): void {
    this.loading = true;
    this.loadError = null;
    this.cartService.getCart().subscribe({
      next: lines => {
        this.cartItems = lines;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Panier indisponible (vérifiez order-service et la connexion).';
        this.loading = false;
      }
    });
  }

  removeItem(item: CartLineUi): void {
    this.busy = true;
    this.cartService.removeLine(item.lineId).subscribe({
      next: () => {
        this.busy = false;
        this.reloadCart();
      },
      error: () => {
        this.busy = false;
      }
    });
  }

  updateQuantity(item: CartLineUi, delta: number): void {
    if (delta > 0) {
      this.busy = true;
      this.cartService.add(item.bookId, 1, item.formatBackend).subscribe({
        next: () => {
          this.busy = false;
          this.reloadCart();
        },
        error: () => {
          this.busy = false;
        }
      });
      return;
    }
    if (item.quantity <= 1) {
      this.removeItem(item);
      return;
    }
    this.busy = true;
    const newQty = item.quantity - 1;
    this.cartService.removeLine(item.lineId).pipe(
      switchMap(() =>
        newQty > 0
          ? this.cartService.add(item.bookId, newQty, item.formatBackend)
          : of(null)
      )
    ).subscribe({
      next: () => {
        this.busy = false;
        this.reloadCart();
      },
      error: () => {
        this.busy = false;
      }
    });
  }

  getTotalItems(): number {
    return this.cartItems.reduce((t, i) => t + i.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((t, i) => t + i.lineTotal, 0);
  }

  getTaxes(): number {
    return this.getSubtotal() * this.taxRate;
  }

  getTotal(): number {
    return this.getSubtotal() + this.shippingCost + this.getTaxes();
  }
}
