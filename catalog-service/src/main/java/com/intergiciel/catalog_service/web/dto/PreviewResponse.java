package com.intergiciel.catalog_service.web.dto;

import java.time.Instant;

public record PreviewResponse(
		String signedUrl,
		Instant expiresAt,
		String note
) {
}
