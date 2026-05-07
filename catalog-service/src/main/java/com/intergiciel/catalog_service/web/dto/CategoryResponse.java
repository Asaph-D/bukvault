package com.intergiciel.catalog_service.web.dto;

import java.util.UUID;

public record CategoryResponse(
		UUID id,
		String name,
		String slug,
		String description,
		UUID parentId,
		int displayOrder,
		String iconUrl,
		long bookCount
) {
}
