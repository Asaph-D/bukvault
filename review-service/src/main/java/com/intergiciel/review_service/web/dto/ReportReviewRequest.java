package com.intergiciel.review_service.web.dto;

import com.intergiciel.review_service.domain.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportReviewRequest(
		@NotNull ReportReason reason,
		@Size(max = 1000) String details
) {
}
