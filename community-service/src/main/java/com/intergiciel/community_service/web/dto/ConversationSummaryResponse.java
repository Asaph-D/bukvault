package com.intergiciel.community_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ConversationSummaryResponse(
		UUID id,
		UUID peerUserId,
		String lastMessagePreview,
		Instant updatedAt) {
}
