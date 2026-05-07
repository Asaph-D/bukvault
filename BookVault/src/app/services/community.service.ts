import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CommunityBuddyDto,
  CommunityEventDto,
  CommunityHubDto,
  CommunityMemberDto,
  CommunityThreadDto
} from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private readonly base = `${environment.apiUrl}/community`;

  constructor(private http: HttpClient) {}

  getHub(): Observable<CommunityHubDto> {
    return this.http.get<CommunityHubDto>(`${this.base}/hub`);
  }

  getThreads(): Observable<CommunityThreadDto[]> {
    return this.http.get<CommunityThreadDto[]>(`${this.base}/threads`);
  }

  getEvents(): Observable<CommunityEventDto[]> {
    return this.http.get<CommunityEventDto[]>(`${this.base}/events`);
  }

  getBuddies(): Observable<CommunityBuddyDto[]> {
    return this.http.get<CommunityBuddyDto[]>(`${this.base}/buddies`);
  }

  searchMembers(q: string, limit = 12): Observable<CommunityMemberDto[]> {
    return this.http.get<CommunityMemberDto[]>(`${this.base}/members/search`, {
      params: { q, limit },
    });
  }

  likeBook(bookId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/likes`, { bookId });
  }

  unlikeBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/likes/${bookId}`);
  }

  isBookLiked(bookId: string): Observable<{ liked: boolean }> {
    return this.http.get<{ liked: boolean }>(`${this.base}/likes/${bookId}`);
  }

  recommendBuddies(limit = 6): Observable<CommunityMemberDto[]> {
    return this.http.get<CommunityMemberDto[]>(`${this.base}/recommendations/buddies`, {
      params: { limit },
    });
  }
}
