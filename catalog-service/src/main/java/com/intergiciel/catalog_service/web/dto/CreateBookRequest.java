package com.intergiciel.catalog_service.web.dto;

import com.intergiciel.catalog_service.domain.BookFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateBookRequest(
		@NotBlank @Size(max = 32) String isbn,
		@NotBlank @Size(max = 500) String title,
		@Size(max = 12000) String description,
		@NotNull @DecimalMin("0.0") BigDecimal price,
		@NotBlank @Size(max = 32) String language,
		@NotNull BookFormat format,
		@NotNull @Size(min = 1) List<UUID> categoryIds,
		@Size(max = 2000) String coverUrl,
		/** Renseigné par un ADMIN pour créer au nom d’un auteur. */
		UUID authorUserId
) {
}
