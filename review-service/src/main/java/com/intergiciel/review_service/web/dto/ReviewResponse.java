package com.intergiciel.review_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
		Long id,
		UUID bookId,
		UUID userId,
		String reviewerEmail,
		String reviewerDisplayName,
		String reviewerAvatarUrl,
		int rating,
		String title,
		String body,
		boolean verifiedPurchase,
		long helpfulCount,
		Instant createdAt,
		Instant updatedAt
) {
}
