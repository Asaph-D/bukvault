package com.intergiciel.review_service.repository;

import com.intergiciel.review_service.domain.ReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

	Page<ReviewEntity> findByBookIdOrderByCreatedAtDesc(UUID bookId, Pageable pageable);

	Optional<ReviewEntity> findByBookIdAndUserId(UUID bookId, UUID userId);

	Optional<ReviewEntity> findByIdAndBookId(Long id, UUID bookId);
}
