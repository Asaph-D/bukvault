import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  PageDto,
  ReaderSettingsDto,
  UpdateReaderSettingsRequest,
  UpdateUserActiveRequest,
  UpdateUserProfileRequest,
  UpdateUserRoleRequest,
  UserProfileDto,
  UserRoleDto,
} from '../models/api.types';

export interface AdminUsersListParams {
  page?: number;
  size?: number;
  role?: UserRoleDto | '';
  active?: boolean | null;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  list(params: AdminUsersListParams = {}): Observable<PageDto<UserProfileDto>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20));
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.active !== undefined && params.active !== null) {
      httpParams = httpParams.set('active', String(params.active));
    }
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    return this.http.get<PageDto<UserProfileDto>>(this.base, { params: httpParams });
  }

  getById(userId: string): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.base}/${userId}`);
  }

  updateProfile(userId: string, body: UpdateUserProfileRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.base}/${userId}`, body);
  }

  updateRole(userId: string, role: UserRoleDto): Observable<UserProfileDto> {
    const body: UpdateUserRoleRequest = { role };
    return this.http.put<UserProfileDto>(`${this.base}/${userId}/role`, body);
  }

  setActive(userId: string, active: boolean): Observable<UserProfileDto> {
    const body: UpdateUserActiveRequest = { active };
    return this.http.put<UserProfileDto>(`${this.base}/${userId}/active`, body);
  }

  deactivate(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${userId}`);
  }

  getReaderSettings(userId: string): Observable<ReaderSettingsDto> {
    return this.http.get<ReaderSettingsDto>(`${this.base}/${userId}/reader-settings`);
  }

  updateReaderSettings(userId: string, body: UpdateReaderSettingsRequest): Observable<ReaderSettingsDto> {
    return this.http.put<ReaderSettingsDto>(`${this.base}/${userId}/reader-settings`, body);
  }
}
