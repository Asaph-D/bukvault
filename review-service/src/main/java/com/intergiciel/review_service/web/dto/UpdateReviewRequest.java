package com.intergiciel.review_service.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateReviewRequest(
		@Min(1) @Max(5) int rating,
		@Size(max = 200) String title,
		@NotBlank @Size(min = 10, max = 8000) String body
) {
}
