package com.intergiciel.review_service.repository;

import com.intergiciel.review_service.domain.ReviewHelpfulEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReviewHelpfulRepository extends JpaRepository<ReviewHelpfulEntity, Long> {

	long countByReview_Id(Long reviewId);

	boolean existsByReview_IdAndUserId(Long reviewId, UUID userId);

	Optional<ReviewHelpfulEntity> findByReview_IdAndUserId(Long reviewId, UUID userId);

	void deleteByReview_IdAndUserId(Long reviewId, UUID userId);
}
