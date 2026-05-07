package com.intergiciel.community_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ChatMessageResponse(UUID id, UUID senderId, String content, Instant createdAt) {
}
