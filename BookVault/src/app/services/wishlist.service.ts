import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MoveToCartResponseDto, WishlistItemDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly base = `${environment.apiUrl}/wishlist`;

  constructor(private http: HttpClient) {}

  list(): Observable<WishlistItemDto[]> {
    return this.http.get<WishlistItemDto[]>(this.base);
  }

  add(bookId: string): Observable<WishlistItemDto> {
    return this.http.post<WishlistItemDto>(this.base, { bookId });
  }

  remove(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${bookId}`);
  }

  /** Transfère les éléments vers le panier (JWT transmis par l’interceptor). */
  moveAllToCart(): Observable<MoveToCartResponseDto> {
    return this.http.post<MoveToCartResponseDto>(`${this.base}/move-to-cart`, {});
  }
}
