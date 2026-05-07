package com.intergiciel.reading_service.web.dto;

import com.intergiciel.reading_service.domain.ReadingMediaType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record UpdateProgressRequest(
		@NotNull ReadingMediaType mediaType,
		@NotBlank String positionJson,
		String deviceId,
		Instant clientUpdatedAt
) {
}
