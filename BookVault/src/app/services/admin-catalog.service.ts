import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { BookListItemDto, PageDto, PublishBookRequestDto } from '../models/api.types';
import { BookDetailDto } from '../models/api.types';

export type BookStatusFilter = '' | 'PUBLISHED' | 'DRAFT' | 'REJECTED';

export interface AdminCatalogListParams {
  page?: number;
  size?: number;
  status?: BookStatusFilter;
  authorId?: string;
  q?: string;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCatalogService {
  private readonly catalogBase = `${environment.apiUrl}/catalog/admin`;
  private readonly booksBase = `${environment.apiUrl}/books`;

  constructor(private http: HttpClient) {}

  listBooks(params: AdminCatalogListParams = {}): Observable<PageDto<BookListItemDto>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.authorId) {
      httpParams = httpParams.set('authorId', params.authorId);
    }
    if (params.q?.trim()) {
      httpParams = httpParams.set('q', params.q.trim());
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    return this.http.get<PageDto<BookListItemDto>>(`${this.catalogBase}/books`, { params: httpParams });
  }

  getBook(id: string): Observable<BookDetailDto> {
    return this.http.get<BookDetailDto>(`${this.booksBase}/${id}`);
  }

  setPublished(id: string, publish: boolean): Observable<BookDetailDto> {
    const body: PublishBookRequestDto = { publish };
    return this.http.patch<BookDetailDto>(`${this.booksBase}/${id}/publish`, body);
  }
}
