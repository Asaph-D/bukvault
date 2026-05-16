package com.intergiciel.review_service.web;

import com.intergiciel.review_service.repository.ReviewReportRepository;
import com.intergiciel.review_service.web.dto.PlatformReviewStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews/stats")
@Tag(name = "Review stats", description = "Agrégats plateforme (admin)")
public class ReviewStatsController {

	private final ReviewReportRepository reviewReportRepository;

	public ReviewStatsController(ReviewReportRepository reviewReportRepository) {
		this.reviewReportRepository = reviewReportRepository;
	}

	@GetMapping("/platform")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Signalements ouverts pour la vue d'ensemble admin")
	public PlatformReviewStatsResponse platform() {
		return new PlatformReviewStatsResponse(reviewReportRepository.count());
	}
}
