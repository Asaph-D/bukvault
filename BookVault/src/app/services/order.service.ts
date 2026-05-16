import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponseDto, PageDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly base = `${environment.apiUrl}/orders`;

  constructor(private http: HttpClient) {}

  listMyOrders(page = 0, size = 20): Observable<PageDto<OrderResponseDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageDto<OrderResponseDto>>(this.base, { params });
  }
}
