package com.intergiciel.catalog_service.web.dto;

import java.util.UUID;

public record CategorySummaryResponse(
		UUID id,
		String name,
		String slug
) {
}
