package com.intergiciel.review_service.web;

import com.intergiciel.review_service.service.ReviewService;
import com.intergiciel.review_service.support.AuthSupport;
import com.intergiciel.review_service.web.dto.HelpfulResponse;
import com.intergiciel.review_service.web.dto.ReportReviewRequest;
import com.intergiciel.review_service.web.dto.ReviewResponse;
import com.intergiciel.review_service.web.dto.UpdateReviewRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reviews")
@Tag(name = "Avis")
public class ReviewsRestController {

	private final ReviewService reviewService;

	public ReviewsRestController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping("/{id}")
	@Operation(summary = "Détail d'un avis")
	public ReviewResponse getOne(@PathVariable Long id) {
		return reviewService.getById(id);
	}

	@PutMapping("/{id}")
	@Operation(summary = "Modifier son avis")
	public ReviewResponse update(
			@PathVariable Long id,
			Authentication authentication,
			@Valid @RequestBody UpdateReviewRequest request) {
		return reviewService.update(id, AuthSupport.userId(authentication), AuthSupport.isAdmin(authentication), request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Supprimer un avis")
	public void delete(@PathVariable Long id, Authentication authentication) {
		reviewService.delete(id, AuthSupport.userId(authentication), AuthSupport.isAdmin(authentication));
	}

	@PostMapping("/{id}/helpful")
	@Operation(summary = "Basculer « utile »")
	public HelpfulResponse helpful(@PathVariable Long id, Authentication authentication) {
		return reviewService.toggleHelpful(id, AuthSupport.userId(authentication));
	}

	@PostMapping("/{id}/report")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Signaler un avis")
	public void report(
			@PathVariable Long id,
			Authentication authentication,
			@Valid @RequestBody ReportReviewRequest request) {
		reviewService.report(id, AuthSupport.userId(authentication), request);
	}
}
