package com.intergiciel.review_service.web;

import com.intergiciel.review_service.service.ReviewService;
import com.intergiciel.review_service.support.AuthSupport;
import com.intergiciel.review_service.web.dto.CreateReviewRequest;
import com.intergiciel.review_service.web.dto.ReviewResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/books/{bookId}/reviews")
@Tag(name = "Avis par livre")
public class BookReviewsController {

	private final ReviewService reviewService;

	public BookReviewsController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping
	@Operation(summary = "Liste paginée des avis")
	public Page<ReviewResponse> list(
			@PathVariable UUID bookId,
			@PageableDefault(size = 20) Pageable pageable) {
		return reviewService.listByBook(bookId, pageable);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Publier un avis (un par utilisateur et par livre)")
	public ReviewResponse create(
			@PathVariable UUID bookId,
			Authentication authentication,
			@Valid @RequestBody CreateReviewRequest request) {
		return reviewService.create(bookId, AuthSupport.userId(authentication), request);
	}
}
