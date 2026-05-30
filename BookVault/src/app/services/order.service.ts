import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponseDto, PageDto, PurchasedBookDto } from '../models/api.types';

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

  /** Paiement stub côté backend : passage en PAID. */
  pay(id: number): Observable<OrderResponseDto> {
    return this.http.post<OrderResponseDto>(`${this.base}/${id}/pay`, {});
  }

  listMyLibrary(): Observable<PurchasedBookDto[]> {
    return this.http.get<PurchasedBookDto[]>(`${this.base}/my-library`);
  }
}
