package com.intergiciel.community_service.service;

import com.intergiciel.community_service.web.dto.ChatMessageResponse;
import com.intergiciel.community_service.web.dto.ConversationSummaryResponse;
import com.intergiciel.community_service.web.dto.SalonMessageResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CommunityRealtimePublisher {

	private final SimpMessagingTemplate messagingTemplate;

	public CommunityRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	public void publishDirectMessage(UUID conversationId, ChatMessageResponse message) {
		messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, message);
	}

	public void publishInboxUpdate(UUID userId, ConversationSummaryResponse summary) {
		messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/inbox", summary);
	}

	public void publishSalonMessage(UUID threadId, SalonMessageResponse message) {
		messagingTemplate.convertAndSend("/topic/salons/" + threadId, message);
	}
}
