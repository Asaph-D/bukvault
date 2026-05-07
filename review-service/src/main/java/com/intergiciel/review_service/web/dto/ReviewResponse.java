package com.intergiciel.review_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
		Long id,
		UUID bookId,
		UUID userId,
		int rating,
		String title,
		String body,
		boolean verifiedPurchase,
		long helpfulCount,
		Instant createdAt,
		Instant updatedAt
) {
}
