import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../components/header/header.component';
import { FooterComponent } from '../../../components/footer/footer.component';
import { PaymentService, PaymentMethod } from '../../../services/payment.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent, RouterModule],
  template: `
    <app-header></app-header>
    
    <div class="pt-app-header bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors">
      <div class="container mx-auto px-4 py-12">
        <div class="max-w-5xl mx-auto">
          <h1 class="text-2xl sm:text-3xl font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-8">Paiement</h1>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div class="md:col-span-2">
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Moyens de paiement</h2>
                
                <div *ngIf="paymentMethods.length > 0" class="mb-6">
                  <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3">Moyens sauvegardés</h3>
                  
                  <div *ngFor="let method of paymentMethods" class="flex items-center border border-slate-200 dark:border-slate-700 rounded-md p-4 mb-3 hover:border-indigo-500 dark:hover:border-indigo-400">
                    <div class="mr-3">
                      <input type="radio" [id]="method.id" name="paymentMethod" [value]="method.id" 
                             [checked]="method.isDefault" (change)="selectPaymentMethod(method.id)"
                             class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600">
                    </div>
                    <label [for]="method.id" class="flex-1 flex items-center cursor-pointer">
                      <i [class]="'fas ' + method.icon + ' text-xl mr-3 text-indigo-600 dark:text-indigo-400'"></i>
                      <span>{{ method.name }}</span>
                      <span *ngIf="method.isDefault" class="ml-auto text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">Par défaut</span>
                    </label>
                    <button (click)="deletePaymentMethod(method.id)" class="ml-2 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400">
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
                
                <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 class="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-4">Ajouter un nouveau moyen de paiement</h3>
                  
                  <div class="flex mb-4 border-b border-slate-200 dark:border-slate-700">
                    <button (click)="setPaymentTab('card')" [class]="paymentTab === 'card' ? activeTabClass : inactiveTabClass">
                      <i class="fas fa-credit-card mr-2"></i>Carte
                    </button>
                    <button (click)="setPaymentTab('paypal')" [class]="paymentTab === 'paypal' ? activeTabClass : inactiveTabClass">
                      <i class="fab fa-paypal mr-2"></i>PayPal
                    </button>
                  </div>
                  
                  <div [ngSwitch]="paymentTab">
                    <div *ngSwitchCase="'card'">
                      <form [formGroup]="cardForm" (ngSubmit)="onSubmitCard()">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div class="col-span-2">
                            <label for="cardNumber" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Numéro de carte</label>
                            <input type="text" id="cardNumber" formControlName="cardNumber" placeholder="1234 5678 9012 3456"
                                   class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                            <div *ngIf="submitted && cardForm.controls['cardNumber'].errors" class="text-red-500 text-sm mt-1">
                              <span *ngIf="cardForm.controls['cardNumber'].errors['required']">Numéro de carte requis</span>
                            </div>
                          </div>
                          
                          <div>
                            <label for="expiryDate" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date d'expiration</label>
                            <input type="text" id="expiryDate" formControlName="expiryDate" placeholder="MM/AA"
                                   class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                            <div *ngIf="submitted && cardForm.controls['expiryDate'].errors" class="text-red-500 text-sm mt-1">
                              <span *ngIf="cardForm.controls['expiryDate'].errors['required']">Date d'expiration requise</span>
                            </div>
                          </div>
                          
                          <div>
                            <label for="cvv" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">CVV</label>
                            <input type="text" id="cvv" formControlName="cvv" placeholder="123"
                                   class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                            <div *ngIf="submitted && cardForm.controls['cvv'].errors" class="text-red-500 text-sm mt-1">
                              <span *ngIf="cardForm.controls['cvv'].errors['required']">CVV requis</span>
                            </div>
                          </div>
                          
                          <div class="col-span-2">
                            <label for="cardHolder" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Titulaire de la carte</label>
                            <input type="text" id="cardHolder" formControlName="cardHolder" placeholder="NOM PRÉNOM"
                                   class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                            <div *ngIf="submitted && cardForm.controls['cardHolder'].errors" class="text-red-500 text-sm mt-1">
                              <span *ngIf="cardForm.controls['cardHolder'].errors['required']">Nom du titulaire requis</span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="flex items-center mb-4">
                          <input type="checkbox" id="saveCard" formControlName="saveCard" class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600 rounded">
                          <label for="saveCard" class="ml-2 block text-sm text-zinc-700 dark:text-zinc-300">Sauvegarder cette carte pour mes futurs achats</label>
                        </div>
                        
                        <div class="flex items-center mb-4">
                          <input type="checkbox" id="defaultCard" formControlName="defaultCard" class="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500/50 border-slate-300 dark:border-slate-600 rounded">
                          <label for="defaultCard" class="ml-2 block text-sm text-zinc-700 dark:text-zinc-300">Définir comme moyen de paiement par défaut</label>
                        </div>
                        
                        <button type="submit" [disabled]="loading" class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition disabled:opacity-50">
                          <span *ngIf="!loading">Ajouter la carte</span>
                          <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Chargement...</span>
                        </button>
                      </form>
                    </div>
                    
                    <div *ngSwitchCase="'paypal'" class="text-center py-8">
                      <i class="fab fa-paypal text-indigo-600 dark:text-indigo-400 text-5xl mb-4"></i>
                      <p class="mb-4 text-zinc-700 dark:text-zinc-300">Vous serez redirigé vers PayPal pour compléter votre paiement.</p>
                      <button (click)="payWithPaypal()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition">
                        Payer avec PayPal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Adresse de facturation</h2>
                
                <form [formGroup]="billingForm">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label for="firstName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Prénom</label>
                      <input type="text" id="firstName" formControlName="firstName" 
                             class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                    </div>
                    
                    <div>
                      <label for="lastName" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nom</label>
                      <input type="text" id="lastName" formControlName="lastName" 
                             class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                    </div>
                    
                    <div class="col-span-2">
                      <label for="address" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Adresse</label>
                      <input type="text" id="address" formControlName="address" 
                             class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                    </div>
                    
                    <div>
                      <label for="city" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ville</label>
                      <input type="text" id="city" formControlName="city" 
                             class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                    </div>
                    
                    <div>
                      <label for="postalCode" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Code postal</label>
                      <input type="text" id="postalCode" formControlName="postalCode" 
                             class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                    </div>
                    
                    <div class="col-span-2">
                      <label for="country" class="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Pays</label>
                      <select id="country" formControlName="country" 
                              class="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
                        <option value="">Sélectionnez un pays</option>
                        <option value="FR">France</option>
                        <option value="BE">Belgique</option>
                        <option value="CH">Suisse</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            <div>
              <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
                <h2 class="text-lg font-semibold font-[family-name:var(--font-display)] text-slate-900 dark:text-white mb-4">Résumé de la commande</h2>
                
                <div class="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
                  <div class="flex justify-between mb-2">
                    <span class="text-zinc-600 dark:text-zinc-400">Sous-total</span>
                    <span>55,48 frs</span>
                  </div>
                  <div class="flex justify-between mb-2">
                    <span class="text-zinc-600 dark:text-zinc-400">Livraison</span>
                    <span>4,99 frs</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-600 dark:text-zinc-400">Taxes</span>
                    <span>11,10 frs</span>
                  </div>
                </div>
                
                <div class="flex justify-between font-semibold text-lg text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>71,57 frs</span>
                </div>
              </div>
              
              <button (click)="placeOrder()" [disabled]="!isPaymentSelected || loading" 
                      class="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition disabled:bg-zinc-400 dark:disabled:bg-zinc-600 disabled:cursor-not-allowed">
                <span *ngIf="!loading">Confirmer et payer</span>
                <span *ngIf="loading"><i class="fas fa-spinner fa-spin mr-2"></i>Traitement du paiement...</span>
              </button>
              
              <p class="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-4">
                En confirmant votre commande, vous acceptez nos <a href="#" class="text-indigo-600 dark:text-indigo-400 hover:underline">Conditions générales de vente</a>.
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
  paymentTab: 'card' | 'paypal' = 'card';
  activeTabClass =
    'px-4 py-2 border-b-2 border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 font-medium text-sm';
  inactiveTabClass = 'px-4 py-2 text-zinc-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white text-sm';
  
  cardForm: FormGroup;
  billingForm: FormGroup;
  loading = false;
  submitted = false;
  
  paymentMethods: PaymentMethod[] = [];
  selectedPaymentMethod: string | null = null;
  isPaymentSelected = false;

  constructor(
    private formBuilder: FormBuilder,
    private paymentService: PaymentService,
    private router: Router
  ) {
    this.cardForm = this.formBuilder.group({
      cardNumber: ['', Validators.required],
      expiryDate: ['', Validators.required],
      cvv: ['', Validators.required],
      cardHolder: ['', Validators.required],
      saveCard: [true],
      defaultCard: [false]
    });
    
    this.billingForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      address: [''],
      city: [''],
      postalCode: [''],
      country: ['']
    });
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.paymentService.getPaymentMethods().subscribe(methods => {
      this.paymentMethods = methods;
      
      // Check if there's a default payment method
      const defaultMethod = methods.find(m => m.isDefault);
      if (defaultMethod) {
        this.selectedPaymentMethod = defaultMethod.id;
        this.isPaymentSelected = true;
      }
    });
  }

  setPaymentTab(tab: 'card' | 'paypal'): void {
    this.paymentTab = tab;
  }

  selectPaymentMethod(id: string): void {
    this.selectedPaymentMethod = id;
    this.isPaymentSelected = true;
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
    
    if (this.cardForm.invalid) {
      return;
    }
    
    this.loading = true;
    
    const cardNumber = this.cardForm.controls['cardNumber'].value;
    const lastFourDigits = cardNumber.slice(-4);
    
    const newMethod: Partial<PaymentMethod> = {
      type: 'credit_card',
      name: `Carte se terminant par ${lastFourDigits}`,
      isDefault: this.cardForm.controls['defaultCard'].value
    };
    
    if (this.cardForm.controls['saveCard'].value) {
      this.paymentService.addPaymentMethod(newMethod).subscribe({
        next: method => {
          this.paymentMethods.push(method);
          this.selectedPaymentMethod = method.id;
          this.isPaymentSelected = true;
          this.loading = false;
          this.cardForm.reset();
          this.submitted = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      // If not saving, just use it for this transaction
      this.loading = false;
      this.isPaymentSelected = true;
      this.selectedPaymentMethod = 'temp_card';
    }
  }

  payWithPaypal(): void {
    // Simulate PayPal integration
    alert('Vous allez être redirigé vers PayPal (simulation)');
    
    setTimeout(() => {
      this.isPaymentSelected = true;
      this.selectedPaymentMethod = 'paypal';
    }, 1000);
  }

  placeOrder(): void {
    if (!this.isPaymentSelected) {
      return;
    }
    
    this.loading = true;
    
    // Simulate payment processing
    setTimeout(() => {
      this.loading = false;
      this.router.navigate(['/checkout/confirmation']);
    }, 2000);
  }
}