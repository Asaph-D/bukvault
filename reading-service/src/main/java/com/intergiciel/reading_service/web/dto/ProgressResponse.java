package com.intergiciel.reading_service.web.dto;

import com.intergiciel.reading_service.domain.ReadingMediaType;

import java.time.Instant;
import java.util.UUID;

public record ProgressResponse(
		UUID bookId,
		ReadingMediaType mediaType,
		String positionJson,
		String deviceId,
		Instant serverUpdatedAt,
		Instant clientUpdatedAt
) {
}
