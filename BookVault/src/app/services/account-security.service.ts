import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChangePasswordRequestDto, RevokeAllSessionsResponseDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class AccountSecurityService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  changePassword(body: ChangePasswordRequestDto): Observable<void> {
    return this.http.post<void>(`${this.base}/auth/change-password`, body);
  }

  revokeAllSessions(): Observable<RevokeAllSessionsResponseDto> {
    return this.http.post<RevokeAllSessionsResponseDto>(`${this.base}/auth/logout-all`, {});
  }
}

