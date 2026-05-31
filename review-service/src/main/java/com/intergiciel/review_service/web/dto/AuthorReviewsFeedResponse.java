package com.intergiciel.review_service.web.dto;

import org.springframework.data.domain.Page;

public record AuthorReviewsFeedResponse(
		Page<AuthorReviewItemResponse> reviews,
		AuthorReviewsSummaryResponse summary) {
}
