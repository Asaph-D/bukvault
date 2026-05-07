package com.intergiciel.reading_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateAnnotationRequest(
		@NotNull UUID bookId,
		@NotBlank String anchorJson,
		@NotBlank String body
) {
}
