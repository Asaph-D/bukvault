package com.intergiciel.catalog_service.web.dto;

import com.intergiciel.catalog_service.domain.BookFormat;
import com.intergiciel.catalog_service.domain.BookStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookListItemResponse(
		UUID id,
		String title,
		String isbn,
		UUID authorId,
		BigDecimal price,
		String language,
		BookFormat format,
		BookStatus status,
		String coverUrl,
		double averageRating,
		int reviewCount,
		long viewCount,
		Instant publishedAt,
		Instant createdAt
) {
}
