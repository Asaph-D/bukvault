package com.intergiciel.catalog_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpsertCategoryRequest(
		@NotBlank @Size(max = 200) String name,
		@Size(max = 4000) String description,
		UUID parentId,
		int displayOrder,
		@Size(max = 2000) String iconUrl
) {
}
