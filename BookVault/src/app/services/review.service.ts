import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CreateReviewRequestDto,
  PageDto,
  ReviewResponseDto,
} from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listByBook(bookId: string, page = 0, size = 20): Observable<PageDto<ReviewResponseDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageDto<ReviewResponseDto>>(`${this.base}/books/${bookId}/reviews`, {
      params,
    });
  }

  create(bookId: string, body: CreateReviewRequestDto): Observable<ReviewResponseDto> {
    return this.http.post<ReviewResponseDto>(`${this.base}/books/${bookId}/reviews`, body);
  }
}
