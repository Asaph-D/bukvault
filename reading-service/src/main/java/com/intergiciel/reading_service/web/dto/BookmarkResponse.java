package com.intergiciel.reading_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record BookmarkResponse(
		UUID id,
		UUID bookId,
		String anchorJson,
		String label,
		Instant createdAt
) {
}
