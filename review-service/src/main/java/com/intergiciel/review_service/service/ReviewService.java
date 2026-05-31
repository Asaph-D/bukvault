package com.intergiciel.review_service.service;

import com.intergiciel.review_service.client.AuthorBookRef;
import com.intergiciel.review_service.client.CatalogAuthorBooksClient;
import com.intergiciel.review_service.config.ReviewProperties;
import com.intergiciel.review_service.domain.ReviewEntity;
import com.intergiciel.review_service.domain.ReviewHelpfulEntity;
import com.intergiciel.review_service.domain.ReviewReportEntity;
import com.intergiciel.review_service.repository.ReviewHelpfulRepository;
import com.intergiciel.review_service.repository.ReviewReportRepository;
import com.intergiciel.review_service.repository.ReviewRepository;
import com.intergiciel.review_service.web.dto.AuthorReviewItemResponse;
import com.intergiciel.review_service.web.dto.AuthorReviewsFeedResponse;
import com.intergiciel.review_service.web.dto.AuthorReviewsSummaryResponse;
import com.intergiciel.review_service.web.dto.CreateReviewRequest;
import com.intergiciel.review_service.web.dto.HelpfulResponse;
import com.intergiciel.review_service.web.dto.ReportReviewRequest;
import com.intergiciel.review_service.web.dto.ReviewResponse;
import com.intergiciel.review_service.web.dto.ReviewerProfile;
import com.intergiciel.review_service.web.dto.UpdateReviewRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ReviewService {

	private final ReviewRepository reviewRepository;
	private final ReviewHelpfulRepository reviewHelpfulRepository;
	private final ReviewReportRepository reviewReportRepository;
	private final OrderEntitlementClient orderEntitlementClient;
	private final ReviewRealtimePublisher reviewRealtimePublisher;
	private final ReviewProperties reviewProperties;
	private final CatalogAuthorBooksClient catalogAuthorBooksClient;

	public ReviewService(ReviewRepository reviewRepository,
			ReviewHelpfulRepository reviewHelpfulRepository,
			ReviewReportRepository reviewReportRepository,
			OrderEntitlementClient orderEntitlementClient,
			ReviewRealtimePublisher reviewRealtimePublisher,
			ReviewProperties reviewProperties,
			CatalogAuthorBooksClient catalogAuthorBooksClient) {
		this.reviewRepository = reviewRepository;
		this.reviewHelpfulRepository = reviewHelpfulRepository;
		this.reviewReportRepository = reviewReportRepository;
		this.orderEntitlementClient = orderEntitlementClient;
		this.reviewRealtimePublisher = reviewRealtimePublisher;
		this.reviewProperties = reviewProperties;
		this.catalogAuthorBooksClient = catalogAuthorBooksClient;
	}

	@Transactional(readOnly = true)
	public AuthorReviewsFeedResponse listForAuthor(
			String authorizationHeader,
			UUID bookIdFilter,
			Integer minRating,
			Pageable pageable) {
		List<AuthorBookRef> myBooks = catalogAuthorBooksClient.listMyBooks(authorizationHeader);
		if (myBooks.isEmpty()) {
			return new AuthorReviewsFeedResponse(
					Page.empty(pageable),
					new AuthorReviewsSummaryResponse(0, 0, 0));
		}
		Map<UUID, AuthorBookRef> bookMap = myBooks.stream()
				.collect(Collectors.toMap(AuthorBookRef::id, b -> b, (a, b) -> a));
		List<UUID> bookIds = myBooks.stream().map(AuthorBookRef::id).toList();
		if (bookIdFilter != null && !bookIds.contains(bookIdFilter)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce livre ne vous appartient pas.");
		}
		Page<ReviewEntity> page = reviewRepository.findForAuthorBooks(
				bookIds, bookIdFilter, minRating, pageable);
		Object[] agg = reviewRepository.aggregateForAuthorBooks(bookIds, bookIdFilter, minRating);
		long total = agg[0] != null ? ((Number) agg[0]).longValue() : 0;
		double avg = agg[1] != null ? ((Number) agg[1]).doubleValue() : 0;
		int booksWithReviews = (int) reviewRepository.countDistinctBooksWithReviews(bookIds);
		AuthorReviewsSummaryResponse summary = new AuthorReviewsSummaryResponse(total, avg, booksWithReviews);
		return new AuthorReviewsFeedResponse(
				page.map(r -> toAuthorItem(r, bookMap.get(r.getBookId()))),
				summary);
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
	public ReviewResponse create(UUID bookId, ReviewerProfile reviewer, CreateReviewRequest request) {
		UUID userId = reviewer.userId();
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
		entity.setReviewerEmail(reviewer.email());
		entity.setReviewerDisplayName(reviewer.displayName());
		entity.setReviewerAvatarUrl(reviewer.avatarUrl());
		ReviewResponse response = toResponse(reviewRepository.save(entity));
		reviewRealtimePublisher.publishNewReview(bookId, response);
		return response;
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

	private AuthorReviewItemResponse toAuthorItem(ReviewEntity r, AuthorBookRef book) {
		ReviewResponse base = toResponse(r);
		String bookTitle = book != null ? book.title() : "Livre";
		String cover = book != null ? book.coverUrl() : null;
		return new AuthorReviewItemResponse(
				base.id(),
				base.bookId(),
				bookTitle,
				cover,
				base.userId(),
				base.reviewerEmail(),
				base.reviewerDisplayName(),
				base.reviewerAvatarUrl(),
				base.rating(),
				base.title(),
				base.body(),
				base.verifiedPurchase(),
				base.helpfulCount(),
				base.createdAt(),
				base.updatedAt());
	}

	private ReviewResponse toResponse(ReviewEntity r) {
		long helpfulCount = reviewHelpfulRepository.countByReview_Id(r.getId());
		String email = r.getReviewerEmail();
		if (email == null || email.isBlank()) {
			email = r.getUserId() + "@bookvault.local";
		}
		String displayName = r.getReviewerDisplayName();
		if (displayName == null || displayName.isBlank()) {
			displayName = "Lecteur " + r.getUserId().toString().substring(0, 8);
		}
		String avatarUrl = r.getReviewerAvatarUrl();
		if (avatarUrl == null || avatarUrl.isBlank()) {
			String base = reviewProperties.getApiPublicBaseUrl().replaceAll("/+$", "");
			avatarUrl = base + "/api/v1/files/avatar/" + r.getUserId();
		}
		return new ReviewResponse(
				r.getId(),
				r.getBookId(),
				r.getUserId(),
				email,
				displayName,
				avatarUrl,
				r.getRating(),
				r.getTitle(),
				r.getBody(),
				r.isVerifiedPurchase(),
				helpfulCount,
				r.getCreatedAt(),
				r.getUpdatedAt());
	}
}
