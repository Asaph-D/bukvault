package com.intergiciel.review_service.repository;

import com.intergiciel.review_service.domain.ReviewReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ReviewReportRepository extends JpaRepository<ReviewReportEntity, Long> {

	boolean existsByReview_IdAndReporterId(Long reviewId, UUID reporterId);
}
