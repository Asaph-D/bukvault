package com.intergiciel.catalog_service.web.dto;

import jakarta.validation.constraints.NotNull;

public record PublishBookRequest(
		@NotNull Boolean publish
) {
}
