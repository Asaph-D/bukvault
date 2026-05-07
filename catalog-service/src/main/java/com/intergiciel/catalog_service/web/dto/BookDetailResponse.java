package com.intergiciel.catalog_service.web.dto;

import com.intergiciel.catalog_service.domain.BookFormat;
import com.intergiciel.catalog_service.domain.BookStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record BookDetailResponse(
		UUID id,
		String title,
		String isbn,
		String description,
		BigDecimal price,
		String language,
		BookFormat format,
		BookStatus status,
		UUID authorId,
		String coverUrl,
		double averageRating,
		int reviewCount,
		long viewCount,
		boolean deleted,
		Instant publishedAt,
		Instant createdAt,
		Instant updatedAt,
		List<CategorySummaryResponse> categories
) {
}
