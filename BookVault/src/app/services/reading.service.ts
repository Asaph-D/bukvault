import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReadingProgressDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Progressions de l’utilisateur connecté (e-book / audio). */
  listProgress(): Observable<ReadingProgressDto[]> {
    return this.http.get<ReadingProgressDto[]>(`${this.base}/reading/progress`);
  }
}
