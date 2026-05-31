package com.intergiciel.review_service.repository;

import com.intergiciel.review_service.domain.ReviewEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<ReviewEntity, Long> {

	Page<ReviewEntity> findByBookIdOrderByCreatedAtDesc(UUID bookId, Pageable pageable);

	@Query("""
			SELECT r FROM ReviewEntity r
			WHERE r.bookId IN :bookIds
			AND (:bookId IS NULL OR r.bookId = :bookId)
			AND (:minRating IS NULL OR r.rating >= :minRating)
			ORDER BY r.createdAt DESC
			""")
	Page<ReviewEntity> findForAuthorBooks(
			@Param("bookIds") Collection<UUID> bookIds,
			@Param("bookId") UUID bookId,
			@Param("minRating") Integer minRating,
			Pageable pageable);

	@Query("""
			SELECT COUNT(r), COALESCE(AVG(r.rating), 0)
			FROM ReviewEntity r
			WHERE r.bookId IN :bookIds
			AND (:bookId IS NULL OR r.bookId = :bookId)
			AND (:minRating IS NULL OR r.rating >= :minRating)
			""")
	Object[] aggregateForAuthorBooks(
			@Param("bookIds") Collection<UUID> bookIds,
			@Param("bookId") UUID bookId,
			@Param("minRating") Integer minRating);

	@Query("""
			SELECT COUNT(DISTINCT r.bookId)
			FROM ReviewEntity r
			WHERE r.bookId IN :bookIds
			""")
	long countDistinctBooksWithReviews(@Param("bookIds") Collection<UUID> bookIds);

	Optional<ReviewEntity> findByBookIdAndUserId(UUID bookId, UUID userId);

	Optional<ReviewEntity> findByIdAndBookId(Long id, UUID bookId);
}
