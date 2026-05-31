package com.intergiciel.review_service.web.dto;

public record AuthorReviewsSummaryResponse(
		long totalReviews,
		double averageRating,
		int booksWithReviews) {
}
