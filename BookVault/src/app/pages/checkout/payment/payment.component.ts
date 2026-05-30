import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { PaymentService, PaymentMethod } from '../../../services/payment.service';
import { AuthService } from '../../../services/auth.service';
import { CartService, CartLineUi } from '../../../services/cart.service';
import { OrderService } from '../../../services/order.service';
import { OrderResponseDto } from '../../../models/api.types';
import { UiToastService } from '../../../services/ui-toast.service';

type PaymentTab = 'card' | 'paypal' | 'mobile_money';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, RouterModule],
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
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Moyens de paiement</h2>

                <div *ngIf="paymentMethods.length > 0" class="mb-6">
                  <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Moyens sauvegardés</h3>

                  <div
                    *ngFor="let method of paymentMethods"
                    class="flex items-center border border-slate-200 dark:border-slate-700 rounded-md p-4 mb-3 hover:border-indigo-500 dark:hover:border-indigo-400"
                  >
                    <div class="mr-3">
                      <input
                        type="radio"
                        [id]="method.id"
                        name="paymentMethod"
                        [value]="method.id"
                        [checked]="method.isDefault"
                        (change)="selectPaymentMethod(method.id)"
                        class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600"
                      />
                    </div>
                    <label [for]="method.id" class="flex-1 flex items-center cursor-pointer">
                      <i [class]="'fas ' + method.icon + ' text-xl mr-3 text-indigo-600 dark:text-indigo-400'"></i>
                      <span>{{ method.name }}</span>
                      <span
                        *ngIf="method.isDefault"
                        class="ml-auto text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded"
                        >Par défaut</span
                      >
                    </label>
                    <button
                      (click)="deletePaymentMethod(method.id)"
                      class="ml-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>

                <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">Choisir un moyen de paiement</h3>

                  <div class="flex flex-wrap mb-4 border-b border-slate-200 dark:border-slate-700">
                    <button (click)="setPaymentTab('card')" [class]="paymentTab === 'card' ? activeTabClass : inactiveTabClass">
                      <i class="fas fa-credit-card mr-2"></i>Carte
                      <span class="ml-2 text-[10px] uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">Plus tard</span>
                    </button>
                    <button (click)="setPaymentTab('paypal')" [class]="paymentTab === 'paypal' ? activeTabClass : inactiveTabClass">
                      <i class="fab fa-paypal mr-2"></i>PayPal
                      <span class="ml-2 text-[10px] uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">Plus tard</span>
                    </button>
                    <button
                      (click)="setPaymentTab('mobile_money')"
                      [class]="paymentTab === 'mobile_money' ? activeTabClass : inactiveTabClass"
                    >
                      <i class="fas fa-mobile-alt mr-2"></i>Mobile Money
                      <img src="assets/payments/mtn-new-logo.png" alt="" class="inline-block h-5 ml-2 object-contain" aria-hidden="true" />
                      <img src="assets/payments/orange.png" alt="" class="inline-block h-5 ml-1 object-contain" aria-hidden="true" />
                    </button>
                  </div>

                  <div [ngSwitch]="paymentTab">
                    <div *ngSwitchCase="'card'">
                      <div class="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        <i class="fas fa-tools mr-2"></i>
                        Paiement par carte bancaire — <strong>développement plus tard</strong>. Vous pouvez déjà enregistrer une carte pour vos futurs achats.
                      </div>
                      <form [formGroup]="cardForm" (ngSubmit)="onSubmitCard()">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div class="col-span-2">
                            <label for="cardNumber" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                              >Numéro de carte</label
                            >
                            <input
                              type="text"
                              id="cardNumber"
                              formControlName="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                            <div *ngIf="submitted && cardForm.controls['cardNumber'].errors" class="text-red-500 text-sm mt-1">
                              <span *ngIf="cardForm.controls['cardNumber'].errors['required']">Numéro de carte requis</span>
                            </div>
                          </div>

                          <div>
                            <label for="expiryDate" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                              >Date d'expiration</label
                            >
                            <input
                              type="text"
                              id="expiryDate"
                              formControlName="expiryDate"
                              placeholder="MM/AA"
                              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>

                          <div>
                            <label for="cvv" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">CVV</label>
                            <input
                              type="text"
                              id="cvv"
                              formControlName="cvv"
                              placeholder="123"
                              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>

                          <div class="col-span-2">
                            <label for="cardHolder" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                              >Titulaire de la carte</label
                            >
                            <input
                              type="text"
                              id="cardHolder"
                              formControlName="cardHolder"
                              placeholder="NOM PRÉNOM"
                              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            />
                          </div>
                        </div>

                        <div class="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="saveCard"
                            formControlName="saveCard"
                            class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <label for="saveCard" class="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
                            >Sauvegarder cette carte pour mes futurs achats</label
                          >
                        </div>

                        <div class="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="defaultCard"
                            formControlName="defaultCard"
                            class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600 rounded"
                          />
                          <label for="defaultCard" class="ml-2 block text-sm text-zinc-700 dark:text-zinc-300"
                            >Définir comme moyen de paiement par défaut</label
                          >
                        </div>

                        <button
                          type="submit"
                          [disabled]="loading"
                          class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
                        >
                          <span *ngIf="!loading">Ajouter la carte</span>
                          <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement…</span>
                        </button>
                      </form>
                    </div>

                    <div *ngSwitchCase="'paypal'" class="py-4">
                      <div class="mb-6 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-900 dark:text-amber-100 text-center">
                        <i class="fas fa-tools mr-2"></i>
                        PayPal — <strong>développement plus tard</strong>
                      </div>
                      <div class="text-center py-4">
                        <i class="fab fa-paypal text-indigo-600 dark:text-indigo-400 text-5xl mb-4"></i>
                        <p class="mb-4 text-zinc-700 dark:text-zinc-300">
                          Vous serez redirigé vers PayPal pour compléter votre paiement.
                        </p>
                        <button
                          type="button"
                          (click)="payWithPaypal()"
                          disabled
                          class="bg-indigo-600 text-white px-6 py-2 rounded-lg opacity-50 cursor-not-allowed"
                        >
                          Payer avec PayPal
                        </button>
                        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-3">Bientôt disponible</p>
                      </div>
                    </div>

                    <div *ngSwitchCase="'mobile_money'" class="py-4">
                      <div class="flex flex-wrap items-stretch gap-4 mb-6">
                        <div
                          class="flex flex-1 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm"
                        >
                          <img
                            src="assets/payments/mtn-new-logo.png"
                            alt="MTN Mobile Money"
                            class="h-12 w-auto max-w-full object-contain"
                          />
                        </div>
                        <div
                          class="flex flex-1 min-w-[140px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-sm"
                        >
                          <img
                            src="assets/payments/orange.png"
                            alt="Orange Money"
                            class="h-12 w-auto max-w-full object-contain"
                          />
                        </div>
                      </div>
                      <div class="flex items-start gap-4 mb-4">
                        <div class="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                          <i class="fas fa-mobile-alt text-amber-700 dark:text-amber-300 text-xl"></i>
                        </div>
                        <div>
                          <p class="text-sm text-zinc-700 dark:text-zinc-300 mb-2">
                            Paiement Mobile Money via
                            <a
                              href="https://g2tpay.net"
                              target="_blank"
                              rel="noopener"
                              class="text-indigo-600 dark:text-indigo-400 underline"
                              >G2TPay</a
                            >
                            — choisissez MTN MoMo ou Orange Money sur la page de paiement.
                          </p>
                          <p class="text-sm text-zinc-500 dark:text-zinc-400">
                            Vous serez redirigé pour saisir votre numéro et confirmer le paiement.
                          </p>
                          <p *ngIf="estimatedXaf" class="text-sm font-medium text-slate-900 dark:text-white mt-3">
                            Montant estimé : {{ estimatedXaf | number: '1.0-0' }} XAF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p *ngIf="checkoutError" class="text-sm text-red-600 dark:text-red-400 mt-4">{{ checkoutError }}</p>
              </div>

              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">
                  Adresse de facturation
                </h2>

                <form [formGroup]="billingForm">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label for="firstName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prénom</label>
                      <input
                        type="text"
                        id="firstName"
                        formControlName="firstName"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label for="lastName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nom</label>
                      <input
                        type="text"
                        id="lastName"
                        formControlName="lastName"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div class="col-span-2">
                      <label for="address" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Adresse</label>
                      <input
                        type="text"
                        id="address"
                        formControlName="address"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label for="city" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ville</label>
                      <input
                        type="text"
                        id="city"
                        formControlName="city"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label for="postalCode" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >Code postal</label
                      >
                      <input
                        type="text"
                        id="postalCode"
                        formControlName="postalCode"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div class="col-span-2">
                      <label for="country" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Pays</label>
                      <select
                        id="country"
                        formControlName="country"
                        class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      >
                        <option value="">Sélectionnez un pays</option>
                        <option value="FR">France</option>
                        <option value="BE">Belgique</option>
                        <option value="CH">Suisse</option>
                        <option value="CM">Cameroun</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">
                  Résumé de la commande
                </h2>

                <p *ngIf="cartLoading" class="text-sm text-zinc-500 mb-3">Chargement du panier…</p>
                <div class="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4" *ngIf="!cartLoading">
                  <div class="flex justify-between mb-2">
                    <span class="text-zinc-600 dark:text-zinc-400">Sous-total ({{ getTotalItems() }} articles)</span>
                    <span>{{ getSubtotal() | currency: 'EUR' }}</span>
                  </div>
                  <div class="flex justify-between mb-2" *ngIf="paymentTab === 'mobile_money' && estimatedXaf">
                    <span class="text-zinc-600 dark:text-zinc-400">Mobile Money (estim.)</span>
                    <span>{{ estimatedXaf | number: '1.0-0' }} XAF</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="text-zinc-600 dark:text-zinc-400">Livraison</span>
                    <span>{{ shippingCost | currency: 'EUR' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-600 dark:text-zinc-400">Taxes (estim.)</span>
                    <span>{{ getTaxes() | currency: 'EUR' }}</span>
                  </div>
                </div>

                <div class="flex justify-between font-semibold text-lg text-slate-900 dark:text-white" *ngIf="!cartLoading">
                  <span>Total (indicatif)</span>
                  <span>{{ getTotal() | currency: 'EUR' }}</span>
                </div>
              </div>

              <button
                (click)="placeOrder()"
                [disabled]="loading || !canCheckout"
                class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg transition disabled:bg-zinc-400 disabled:cursor-not-allowed"
              >
                <span *ngIf="!loading">{{ confirmButtonLabel }}</span>
                <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>{{ loadingLabel }}</span>
              </button>
              <p *ngIf="!configLoading && !g2tpayEnabled" class="text-xs text-center text-red-600 dark:text-red-400 mt-2">
                G2TPay indisponible — vérifiez G2TPAY_ENABLED et la clé API côté serveur.
              </p>
              <p *ngIf="g2tpayEnabled && paymentTab !== 'mobile_money'" class="text-xs text-center text-amber-700 dark:text-amber-300 mt-2">
                Carte et PayPal : développement plus tard — utilisez Mobile Money pour payer maintenant.
              </p>
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
  paymentTab: PaymentTab = 'mobile_money';
  activeTabClass =
    'px-4 py-2 border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-medium text-sm';
  inactiveTabClass = 'px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-sm';

  cardForm: FormGroup;
  billingForm: FormGroup;
  loading = false;
  cartLoading = false;
  submitted = false;
  checkoutError: string | null = null;
  cartItems: CartLineUi[] = [];
  shippingCost = 4.99;
  taxRate = 0.2;

  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethod: string | null = null;
  isPaymentSelected = false;

  g2tpayEnabled = false;
  configLoading = true;
  estimatedXaf: number | null = null;
  private readonly xafRate = 655.957;

  constructor(
    private formBuilder: FormBuilder,
    private paymentService: PaymentService,
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private cartService: CartService,
    private orderService: OrderService,
    private toast: UiToastService,
  ) {
    this.cardForm = this.formBuilder.group({
      cardNumber: ['', Validators.required],
      expiryDate: ['', Validators.required],
      cvv: ['', Validators.required],
      cardHolder: ['', Validators.required],
      saveCard: [true],
      defaultCard: [false],
    });

    this.billingForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      address: [''],
      city: [''],
      postalCode: [''],
      country: [''],
    });
  }

  get confirmButtonLabel(): string {
    if (this.paymentTab === 'mobile_money') return 'Payer avec Mobile Money';
    if (this.paymentTab === 'paypal') return 'Payer avec PayPal (bientôt)';
    return 'Payer par carte (bientôt)';
  }

  get loadingLabel(): string {
    return 'Redirection vers G2TPay…';
  }

  get canCheckout(): boolean {
    return (
      this.g2tpayEnabled &&
      this.paymentTab === 'mobile_money' &&
      !this.cartLoading &&
      this.cartItems.length > 0
    );
  }

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
    this.loadPaymentMethods();
    this.orderService.g2tpayConfig().subscribe({
      next: cfg => {
        this.g2tpayEnabled = cfg.enabled;
        this.configLoading = false;
        if (cfg.enabled) {
          this.paymentTab = 'mobile_money';
        }
      },
      error: () => {
        this.g2tpayEnabled = false;
        this.configLoading = false;
        this.checkoutError = 'Impossible de contacter G2TPay. Réessayez plus tard.';
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

  getTaxes(): number {
    return this.getSubtotal() * this.taxRate;
  }

  getTotal(): number {
    return this.getSubtotal() + this.shippingCost + this.getTaxes();
  }

  loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe(methods => {
      this.paymentMethods = methods;
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        this.selectedPaymentMethod = defaultMethod.id;
        this.isPaymentSelected = true;
      }
    });
  }

  setPaymentTab(tab: PaymentTab): void {
    this.paymentTab = tab;
    if (tab === 'mobile_money') {
      this.isPaymentSelected = true;
    }
  }

  selectPaymentMethod(id: string): void {
    this.selectedPaymentMethod = id;
    this.isPaymentSelected = true;
    this.paymentTab = 'card';
  }

  deletePaymentMethod(id: string): void {
    this.paymentService.deletePaymentMethod(id).subscribe(success => {
      if (success) {
        this.paymentMethods = this.paymentMethods.filter(m => m.id !== id);
        if (this.selectedPaymentMethod === id) {
          this.selectedPaymentMethod = null;
          this.isPaymentSelected = false;
        }
      }
    });
  }

  onSubmitCard(): void {
    this.submitted = true;
    if (this.cardForm.invalid) return;

    this.loading = true;
    const cardNumber = this.cardForm.controls['cardNumber'].value;
    const lastFourDigits = cardNumber.slice(-4);
    const newMethod: Partial<PaymentMethod> = {
      type: 'credit_card',
      name: `Carte se terminant par ${lastFourDigits}`,
      isDefault: this.cardForm.controls['defaultCard'].value,
    };

    if (this.cardForm.controls['saveCard'].value) {
      this.paymentService.addPaymentMethod(newMethod).subscribe({
        next: method => {
          this.paymentMethods.push(method);
          this.selectedPaymentMethod = method.id;
          this.isPaymentSelected = true;
          this.loading = false;
          this.cardForm.reset({ saveCard: true, defaultCard: false });
          this.submitted = false;
          this.toast.success('Carte', 'Moyen de paiement enregistré.');
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
      this.isPaymentSelected = true;
      this.selectedPaymentMethod = 'temp_card';
    }
  }

  payWithPaypal(): void {
    this.toast.info('PayPal', 'Disponible prochainement.');
  }

  placeOrder(): void {
    if (!this.canCheckout || this.loading) return;

    this.loading = true;
    this.checkoutError = null;

    this.orderService.createFromCart().subscribe({
      next: order => this.redirectToG2tpay(order),
      error: err => this.handleError(err, 'Création de commande impossible.'),
    });
  }

  private redirectToG2tpay(order: OrderResponseDto): void {
    if (order?.id == null) {
      this.handleError({}, 'Commande créée sans identifiant.');
      return;
    }
    this.orderService.g2tpayRedirectUrl(order.id).subscribe({
      next: res => {
        if (!res?.redirectUrl) {
          this.handleError({}, 'G2TPay n\'a pas renvoyé d\'URL de redirection.');
          return;
        }
        this.toast.info('G2TPay', res.instruction);
        window.location.href = res.redirectUrl;
      },
      error: err => this.handleError(err, 'Redirection G2TPay impossible.'),
    });
  }

  private handleError(err: { error?: unknown; status?: number; message?: string }, fallback: string): void {
    this.loading = false;
    const body = err?.error;
    let detail: string | undefined;
    if (body && typeof body === 'object') {
      const o = body as Record<string, unknown>;
      detail =
        (typeof o['detail'] === 'string' && o['detail']) ||
        (typeof o['message'] === 'string' && o['message']) ||
        undefined;
    }
    if (!detail && err?.status === 503) {
      detail = 'Service G2TPay indisponible — vérifiez GATEWAY_PUBLIC_URL et G2TPAY_API_KEY (redémarrez order-service).';
    }
    this.checkoutError = detail || fallback;
    this.toast.error('Checkout', this.checkoutError);
  }
}
