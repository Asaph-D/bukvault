import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { AuthService } from '../../../services/auth.service';
import { CartService, CartLineUi } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { OrderResponseDto } from '../../../models/api.types';
import { UiToastService } from '../../../services/ui-toast.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>

    <div class="pt-app-header bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12">
        <div class="max-w-5xl mx-auto">
          <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-8">
            Paiement
          </h1>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-2">
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">Mobile Money</h2>
                <p *ngIf="g2tpayEnabled" class="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Vous serez redirigé vers
                  <a href="https://g2tpay.net" target="_blank" rel="noopener" class="text-indigo-600 dark:text-indigo-400 underline">G2TPay</a>
                  pour saisir votre numéro et choisir MTN MoMo ou Orange Money (Cameroun).
                </p>
                <p *ngIf="!g2tpayEnabled && !configLoading" class="text-sm text-amber-700 dark:text-amber-300">
                  Mode développement : paiement simulé (G2TPay désactivé).
                </p>
                <p *ngIf="checkoutError" class="text-sm text-red-600 dark:text-red-400 mt-3">{{ checkoutError }}</p>
              </div>
            </div>

            <div>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">
                  Résumé
                </h2>
                <p *ngIf="cartLoading" class="text-sm text-zinc-500 mb-3">Chargement du panier…</p>
                <div *ngIf="!cartLoading">
                  <div class="flex justify-between mb-2">
                    <span class="text-zinc-600 dark:text-zinc-400">{{ getTotalItems() }} article(s)</span>
                    <span>{{ getSubtotal() | currency: 'EUR' }}</span>
                  </div>
                  <div class="flex justify-between mb-2" *ngIf="g2tpayEnabled && estimatedXaf">
                    <span class="text-zinc-600 dark:text-zinc-400">Montant Mobile Money</span>
                    <span>{{ estimatedXaf | number: '1.0-0' }} XAF</span>
                  </div>
                  <div class="flex justify-between font-semibold text-lg text-slate-900 dark:text-white pt-3 border-t border-slate-200 dark:border-slate-700">
                    <span>Total</span>
                    <span>{{ getSubtotal() | currency: 'EUR' }}</span>
                  </div>
                </div>
              </div>

              <button
                (click)="placeOrder()"
                [disabled]="loading || cartLoading || !cartItems.length"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                <span *ngIf="!loading">{{ g2tpayEnabled ? 'Payer avec Mobile Money' : 'Confirmer (simulation)' }}</span>
                <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Redirection…</span>
              </button>
              <p *ngIf="!cartLoading && !cartItems.length" class="text-xs text-center text-zinc-500 mt-2">
                Panier vide — <a routerLink="/cart" class="text-indigo-600 underline">retour au panier</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-footer></app-footer>
  `,
})
export class PaymentComponent implements OnInit {
  loading = false;
  cartLoading = false;
  configLoading = true;
  checkoutError: string | null = null;
  cartItems: CartLineUi[] = [];
  g2tpayEnabled = false;
  estimatedXaf: number | null = null;
  private readonly xafRate = 655.957;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private cartService: CartService,
    private orderService: OrderService,
    private toast: UiToastService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout/payment' } });
      return;
    }
    const paymentError = this.route.snapshot.queryParamMap.get('paymentError');
    if (paymentError) {
      this.checkoutError = 'Paiement non confirmé ou annulé. Réessayez.';
      this.toast.error('Paiement', this.checkoutError);
    }
    this.loadCart();
    this.orderService.g2tpayConfig().subscribe({
      next: cfg => {
        this.g2tpayEnabled = cfg.enabled;
        this.configLoading = false;
      },
      error: () => {
        this.g2tpayEnabled = false;
        this.configLoading = false;
      },
    });
  }

  private loadCart(): void {
    this.cartLoading = true;
    this.cartService.getCart().subscribe({
      next: lines => {
        this.cartItems = lines;
        this.estimatedXaf = Math.round(this.getSubtotal() * this.xafRate);
        this.cartLoading = false;
      },
      error: () => {
        this.checkoutError = 'Panier indisponible.';
        this.cartLoading = false;
      },
    });
  }

  getTotalItems(): number {
    return this.cartItems.reduce((t, i) => t + i.quantity, 0);
  }

  getSubtotal(): number {
    return this.cartItems.reduce((t, i) => t + i.lineTotal, 0);
  }

  placeOrder(): void {
    if (!this.cartItems.length || this.loading) return;

    this.loading = true;
    this.checkoutError = null;

    this.orderService.createFromCart().subscribe({
      next: order => {
        if (this.g2tpayEnabled) {
          this.redirectToG2tpay(order);
        } else {
          this.completeMockPayment(order);
        }
      },
      error: err => this.handleError(err, 'Création de commande impossible.'),
    });
  }

  private redirectToG2tpay(order: OrderResponseDto): void {
    this.orderService.g2tpayRedirectUrl(order.id).subscribe({
      next: res => {
        this.toast.info('G2TPay', res.instruction);
        window.location.href = res.redirectUrl;
      },
      error: err => this.handleError(err, 'Redirection G2TPay impossible.'),
    });
  }

  private completeMockPayment(order: OrderResponseDto): void {
    this.orderService.pay(order.id).subscribe({
      next: paid => {
        this.loading = false;
        this.cartService.refreshCount().subscribe();
        this.router.navigate(['/checkout/confirmation'], {
          queryParams: { orderId: paid.id },
          state: { order: paid, cartSnapshot: this.cartItems },
        });
      },
      error: err => this.handleError(err, 'Paiement impossible.'),
    });
  }

  private handleError(err: { error?: { detail?: string; message?: string } }, fallback: string): void {
    this.loading = false;
    this.checkoutError = err?.error?.detail || err?.error?.message || fallback;
    this.toast.error('Checkout', this.checkoutError);
  }
}
