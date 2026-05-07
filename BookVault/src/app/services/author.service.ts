import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Author } from '../models/book.model';
import { environment } from '../../environments/environment';
import { AuthorPublicProfileDto, PageDto } from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(authorId: string): Observable<AuthorPublicProfileDto> {
    return this.http.get<AuthorPublicProfileDto>(`${this.base}/authors/${authorId}`);
  }

  listAuthors(page = 0, size = 48): Observable<AuthorPublicProfileDto[]> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http
      .get<PageDto<AuthorPublicProfileDto>>(`${this.base}/authors`, { params })
      .pipe(map(p => p.content));
  }

  toAuthorUi(d: AuthorPublicProfileDto, index: number): Author {
    const palette: [string, string][] = [
      ['bg-blue-100', 'text-blue-800'],
      ['bg-green-100', 'text-green-800'],
      ['bg-purple-100', 'text-purple-800'],
      ['bg-yellow-100', 'text-yellow-800'],
      ['bg-red-100', 'text-red-800']
    ];
    const [bg, fg] = palette[index % palette.length];
    const name = d.penName || 'Auteur';
    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
        : name.slice(0, 2).toUpperCase();
    return {
      id: d.authorId,
      name,
      initials,
      specialty: 'Auteur',
      bio: d.bio || '',
      socialLinks: {},
      backgroundColor: bg,
      textColor: fg
    };
  }
}
