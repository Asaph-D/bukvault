import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'apple_pay' | 'google_pay' | 'bank_transfer';
  name: string;
  icon: string;
  isDefault?: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  created: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'card_1',
      type: 'credit_card',
      name: 'Visa se terminant par 4242',
      icon: 'fa-credit-card',
      isDefault: true
    },
    {
      id: 'pp_1',
      type: 'paypal',
      name: 'PayPal',
      icon: 'fa-paypal'
    }
  ];

  constructor(private http: HttpClient) { }

  getPaymentMethods(): Observable<PaymentMethod[]> {
    // For demo, return mock data
    return of(this.mockPaymentMethods);
    
    // In production:
    // return this.http.get<PaymentMethod[]>(`${environment.apiUrl}/payment-methods`);
  }

  addPaymentMethod(method: Partial<PaymentMethod>): Observable<PaymentMethod> {
    // Mock implementation
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: method.type || 'credit_card',
      name: method.name || 'New Card',
      icon: method.type === 'paypal' ? 'fa-paypal' : 'fa-credit-card',
      isDefault: method.isDefault || false
    };
    
    if (newMethod.isDefault) {
      this.mockPaymentMethods.forEach(m => m.isDefault = false);
    }
    
    this.mockPaymentMethods.push(newMethod);
    return of(newMethod);
    
    // In production:
    // return this.http.post<PaymentMethod>(`${environment.apiUrl}/payment-methods`, method);
  }

  deletePaymentMethod(id: string): Observable<boolean> {
    const initialLength = this.mockPaymentMethods.length;
    this.mockPaymentMethods = this.mockPaymentMethods.filter(m => m.id !== id);
    return of(initialLength > this.mockPaymentMethods.length);
    
    // In production:
    // return this.http.delete<boolean>(`${environment.apiUrl}/payment-methods/${id}`);
  }

  setDefaultPaymentMethod(id: string): Observable<boolean> {
    this.mockPaymentMethods.forEach(m => {
      m.isDefault = m.id === id;
    });
    return of(true);
    
    // In production:
    // return this.http.post<boolean>(`${environment.apiUrl}/payment-methods/${id}/default`, {});
  }

  createPaymentIntent(amount: number, currency: string = 'EUR'): Observable<PaymentIntent> {
    // Mock payment intent
    const intent: PaymentIntent = {
      id: `pi_${Date.now()}`,
      amount: amount,
      status: 'pending',
      created: new Date()
    };
    
    return of(intent);
    
    // In production:
    // return this.http.post<PaymentIntent>(`${environment.apiUrl}/payment-intents`, {
    //   amount,
    //   currency
    // });
  }

  confirmPayment(paymentIntentId: string, paymentMethodId: string): Observable<PaymentIntent> {
    // Mock confirmation
    return of({
      id: paymentIntentId,
      amount: 100, // example amount
      status: 'succeeded',
      created: new Date()
    });
    
    // In production:
    // return this.http.post<PaymentIntent>(`${environment.apiUrl}/payment-intents/${paymentIntentId}/confirm`, {
    //   payment_method: paymentMethodId
    // });
  }
}