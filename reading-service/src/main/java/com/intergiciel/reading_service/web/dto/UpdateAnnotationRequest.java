package com.intergiciel.reading_service.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAnnotationRequest(
		@NotBlank String anchorJson,
		@NotBlank String body
) {
}
