import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ReaderSettingsDto,
  UpdateReaderSettingsRequest,
  UpdateUserProfileRequest,
  UserProfileDto,
} from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class UserAccountService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Crée le profil user-service si besoin (après inscription). */
  bootstrapProfile(): Observable<UserProfileDto> {
    return this.http.post<UserProfileDto>(`${this.base}/users/bootstrap`, {});
  }

  getProfile(userId: string): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.base}/users/${userId}`);
  }

  updateProfile(userId: string, body: UpdateUserProfileRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.base}/users/${userId}`, body);
  }

  getReaderSettings(userId: string): Observable<ReaderSettingsDto> {
    return this.http.get<ReaderSettingsDto>(`${this.base}/users/${userId}/reader-settings`);
  }

  updateReaderSettings(userId: string, body: UpdateReaderSettingsRequest): Observable<ReaderSettingsDto> {
    return this.http.put<ReaderSettingsDto>(`${this.base}/users/${userId}/reader-settings`, body);
  }

  deactivateAccount(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/users/${userId}`);
  }
}
