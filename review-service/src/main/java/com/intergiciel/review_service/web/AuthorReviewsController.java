package com.intergiciel.review_service.web;

import com.intergiciel.review_service.service.ReviewService;
import com.intergiciel.review_service.web.dto.AuthorReviewsFeedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reviews/author")
@Tag(name = "Avis auteur")
public class AuthorReviewsController {

	private final ReviewService reviewService;

	public AuthorReviewsController(ReviewService reviewService) {
		this.reviewService = reviewService;
	}

	@GetMapping("/mine")
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Avis sur les œuvres de l'auteur connecté")
	public AuthorReviewsFeedResponse mine(
			@RequestHeader("Authorization") String authorization,
			@RequestParam(name = "bookId", required = false) UUID bookId,
			@RequestParam(name = "minRating", required = false) Integer minRating,
			@PageableDefault(size = 20) Pageable pageable) {
		return reviewService.listForAuthor(authorization, bookId, minRating, pageable);
	}
}
