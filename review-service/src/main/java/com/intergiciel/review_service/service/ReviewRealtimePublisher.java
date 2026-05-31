package com.intergiciel.review_service.service;

import com.intergiciel.review_service.web.dto.ReviewResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ReviewRealtimePublisher {

	private final SimpMessagingTemplate messagingTemplate;

	public ReviewRealtimePublisher(SimpMessagingTemplate messagingTemplate) {
		this.messagingTemplate = messagingTemplate;
	}

	public void publishNewReview(UUID bookId, ReviewResponse review) {
		messagingTemplate.convertAndSend("/topic/books/" + bookId + "/reviews", review);
	}
}
