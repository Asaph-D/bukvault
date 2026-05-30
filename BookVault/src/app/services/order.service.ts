import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponseDto, PageDto, PurchasedBookDto, G2tpayConfigDto, G2tpayRedirectResponseDto, PaymentStatusResponseDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  listMyOrders(page = 0, size = 20): Observable<PageDto<OrderResponseDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageDto<OrderResponseDto>>(this.base, { params });
  }

  /** Crée une commande à partir du panier courant (order-service). */
  createFromCart(): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(this.base, {});
  }

  getOne(id: number): Observable<OrderResponseDto> {
    return this.http.get<OrderResponseDto>(`${this.base}/${id}`);
  }

  /** Paiement stub — refusé si G2TPay est activé (utiliser redirect-url). */
  pay(id: number): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(`${this.base}/${id}/pay`, {});
  }

  g2tpayConfig(): Observable<G2tpayConfigDto> {
    return this.http.get<G2tpayConfigDto>(`${this.base}/payments/g2tpay/config`);
  }

  g2tpayRedirectUrl(orderId: number): Observable<G2tpayRedirectResponseDto> {
    return this.http.post<G2tpayRedirectResponseDto>(
      `${this.base}/${orderId}/payments/g2tpay/redirect-url`,
      {},
    );
  }

  paymentStatus(orderId: number): Observable<PaymentStatusResponseDto> {
    return this.http.get<PaymentStatusResponseDto>(`${this.base}/${orderId}/payments/status`);
  }

  listMyLibrary(): Observable<PurchasedBookDto[]> {
    return this.http.get<PurchasedBookDto[]>(`${this.base}/my-library`);
  }
}
