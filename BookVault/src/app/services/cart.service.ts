import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { CartLineDto } from '../models/api.types';
import { BookService } from './book.service';

export interface CartLineUi {
  lineId: number;
  bookId: string;
  title: string;
  author: string;
  price: number;
  quantity: number;
  formatLabel: string;
  formatBackend: string;
  image: string;
  lineTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly base = environment.apiUrl;
  private readonly countSubject = new BehaviorSubject<number>(0);
  /** Nombre d’articles (somme des quantités) — mis à jour après chaque mutation panier. */
  readonly cartCount$ = this.countSubject.asObservable();

  constructor(
    private http: HttpClient,
    private books: BookService
  ) {}

  private publishCount(lines: { quantity: number }[]): void {
    this.countSubject.next(lines.reduce((s, l) => s + l.quantity, 0));
  }

  /** Recharge le panier et met à jour le badge (header, etc.). */
  refreshCount(): Observable<CartLineUi[]> {
    return this.getCart().pipe(tap(lines => this.publishCount(lines)));
  }

  private formatDisplay(fmt: string): string {
    switch (fmt?.toUpperCase()) {
      case 'EBOOK':
        return 'Numérique';
      case 'PHYSICAL':
        return 'Papier';
      case 'BOTH':
        return 'Les deux';
      default:
        return fmt || '—';
    }
  }

  getCart(): Observable<CartLineUi[]> {
    return this.http.get<CartLineDto[]>(`${this.base}/cart`).pipe(
      tap(lines => this.publishCount(lines)),
      switchMap(lines => {
        if (lines.length === 0) return of([]);
        const bookIds = [...new Set(lines.map(l => l.bookId))];
        return forkJoin(
          bookIds.map(id =>
            this.books.getBookById(id).pipe(map(b => ({ id, book: b })))
          )
        ).pipe(
          map(pairs => {
            const byId = new Map(pairs.map(p => [p.id, p.book]));
            return lines.map(line => {
              const b = byId.get(line.bookId);
              return {
                lineId: line.id,
                bookId: line.bookId,
                title: b?.title ?? 'Livre',
                author: b?.author ?? '—',
                price: Number(line.unitPrice),
                quantity: line.quantity,
                formatLabel: this.formatDisplay(line.format),
                formatBackend: line.format || 'EBOOK',
                image: b?.coverImage ?? '',
                lineTotal: Number(line.lineTotal)
              };
            });
          })
        );
      })
    );
  }

  add(bookId: string, quantity: number, format: string): Observable<CartLineDto> {
    return this.http.post<CartLineDto>(`${this.base}/cart/add`, {
      bookId,
      quantity,
      format
    }).pipe(switchMap(line => this.refreshCount().pipe(map(() => line))));
  }

  removeLine(lineId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/cart/${lineId}`)
      .pipe(switchMap(() => this.refreshCount().pipe(map(() => undefined))));
  }
}
