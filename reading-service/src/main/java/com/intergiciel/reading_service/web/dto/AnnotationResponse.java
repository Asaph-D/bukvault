package com.intergiciel.reading_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record AnnotationResponse(
		UUID id,
		UUID bookId,
		String anchorJson,
		String body,
		Instant createdAt,
		Instant updatedAt
) {
}
