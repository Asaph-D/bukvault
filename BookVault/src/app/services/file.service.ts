import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FileUploadResponseDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  uploadEbook(bookId: string, file: File): Observable<FileUploadResponseDto> {
    const fd = new FormData();
    fd.append('bookId', bookId);
    fd.append('file', file, file.name);
    return this.http.post<FileUploadResponseDto>(`${this.base}/files/upload/ebook`, fd);
  }

  uploadCover(bookId: string, file: File): Observable<FileUploadResponseDto> {
    const fd = new FormData();
    fd.append('bookId', bookId);
    fd.append('file', file, file.name);
    return this.http.post<FileUploadResponseDto>(`${this.base}/files/upload/cover`, fd);
  }

  downloadEbook(bookId: string): Observable<Blob> {
    return this.http.get(`${this.base}/files/ebook/${bookId}/download`, {
      responseType: 'blob',
    });
  }
}

