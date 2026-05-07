package com.intergiciel.review_service.service;

import com.intergiciel.review_service.domain.ReviewEntity;
import com.intergiciel.review_service.domain.ReviewHelpfulEntity;
import com.intergiciel.review_service.domain.ReviewReportEntity;
import com.intergiciel.review_service.repository.ReviewHelpfulRepository;
import com.intergiciel.review_service.repository.ReviewReportRepository;
import com.intergiciel.review_service.repository.ReviewRepository;
import com.intergiciel.review_service.web.dto.CreateReviewRequest;
import com.intergiciel.review_service.web.dto.HelpfulResponse;
import com.intergiciel.review_service.web.dto.ReportReviewRequest;
import com.intergiciel.review_service.web.dto.ReviewResponse;
import com.intergiciel.review_service.web.dto.UpdateReviewRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final ReviewHelpfulRepository reviewHelpfulRepository;
	private final ReviewReportRepository reviewReportRepository;
	private final OrderEntitlementClient orderEntitlementClient;

	public ReviewService(ReviewRepository reviewRepository,
			ReviewHelpfulRepository reviewHelpfulRepository,
			ReviewReportRepository reviewReportRepository,
			OrderEntitlementClient orderEntitlementClient) {
		this.reviewRepository = reviewRepository;
		this.reviewHelpfulRepository = reviewHelpfulRepository;
		this.reviewReportRepository = reviewReportRepository;
		this.orderEntitlementClient = orderEntitlementClient;
	}

	@Transactional(readOnly = true)
	public Page<ReviewResponse> listByBook(UUID bookId, Pageable pageable) {
		return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId, pageable)
				.map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public ReviewResponse getById(Long id) {
		ReviewEntity r = reviewRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable."));
		return toResponse(r);
	}

	@Transactional
	public ReviewResponse create(UUID bookId, UUID userId, CreateReviewRequest request) {
		if (reviewRepository.findByBookIdAndUserId(bookId, userId).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Vous avez déjà publié un avis pour ce livre.");
		}
		boolean verified = orderEntitlementClient.hasPurchasedBook(userId, bookId);
		ReviewEntity entity = new ReviewEntity(
				bookId,
				userId,
				request.rating(),
				request.title(),
				request.body(),
				verified);
		return toResponse(reviewRepository.save(entity));
	}

	@Transactional
	public ReviewResponse update(Long reviewId, UUID userId, boolean admin, UpdateReviewRequest request) {
		ReviewEntity entity = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable."));
		if (!admin && !entity.getUserId().equals(userId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Modification réservée à l'auteur.");
		}
		entity.setRating(request.rating());
		entity.setTitle(request.title());
		entity.setBody(request.body());
		entity.touch();
		return toResponse(reviewRepository.save(entity));
	}

	@Transactional
	public void delete(Long reviewId, UUID userId, boolean admin) {
		ReviewEntity entity = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable."));
		if (!admin && !entity.getUserId().equals(userId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Suppression réservée à l'auteur.");
		}
		reviewRepository.delete(entity);
	}

	@Transactional
	public HelpfulResponse toggleHelpful(Long reviewId, UUID userId) {
		ReviewEntity review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable."));
		if (review.getUserId().equals(userId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vous ne pouvez pas voter pour votre propre avis.");
		}
		var existing = reviewHelpfulRepository.findByReview_IdAndUserId(reviewId, userId);
		if (existing.isPresent()) {
			reviewHelpfulRepository.delete(existing.get());
		}
		else {
			reviewHelpfulRepository.save(new ReviewHelpfulEntity(review, userId));
		}
		long count = reviewHelpfulRepository.countByReview_Id(reviewId);
		boolean marked = reviewHelpfulRepository.existsByReview_IdAndUserId(reviewId, userId);
		return new HelpfulResponse(count, marked);
	}

	@Transactional
	public void report(Long reviewId, UUID reporterId, ReportReviewRequest request) {
		ReviewEntity review = reviewRepository.findById(reviewId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Avis introuvable."));
		if (review.getUserId().equals(reporterId)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Signalement inutile sur son propre avis.");
		}
		if (reviewReportRepository.existsByReview_IdAndReporterId(reviewId, reporterId)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Signalement déjà enregistré.");
		}
		reviewReportRepository.save(new ReviewReportEntity(review, reporterId, request.reason(), request.details()));
	}

	private ReviewResponse toResponse(ReviewEntity r) {
		long helpfulCount = reviewHelpfulRepository.countByReview_Id(r.getId());
		return new ReviewResponse(
				r.getId(),
				r.getBookId(),
				r.getUserId(),
				r.getRating(),
				r.getTitle(),
				r.getBody(),
				r.isVerifiedPurchase(),
				helpfulCount,
				r.getCreatedAt(),
				r.getUpdatedAt());
	}
}
