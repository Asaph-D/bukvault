import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessageDto, MessagingConversationDto, PageDto } from '../models/api.types';

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly base = `${environment.apiUrl}/messaging`;

  constructor(private http: HttpClient) {}

  getConversations(): Observable<MessagingConversationDto[]> {
    return this.http.get<MessagingConversationDto[]>(`${this.base}/conversations`);
  }

  startDirect(participantId: string): Observable<MessagingConversationDto> {
    return this.http.post<MessagingConversationDto>(`${this.base}/conversations`, { participantId });
  }

  getMessages(conversationId: string, page = 0, size = 50): Observable<PageDto<ChatMessageDto>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageDto<ChatMessageDto>>(
      `${this.base}/conversations/${conversationId}/messages`,
      { params }
    );
  }

  sendMessage(conversationId: string, content: string): Observable<ChatMessageDto> {
    return this.http.post<ChatMessageDto>(`${this.base}/conversations/${conversationId}/messages`, {
      content
    });
  }
}
