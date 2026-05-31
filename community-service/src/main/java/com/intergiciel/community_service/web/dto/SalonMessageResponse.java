package com.intergiciel.community_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record SalonMessageResponse(
		UUID id,
		UUID threadId,
		UUID senderId,
		String senderEmail,
		String senderDisplayName,
		String senderAvatarUrl,
		String content,
		Instant createdAt) {
}
