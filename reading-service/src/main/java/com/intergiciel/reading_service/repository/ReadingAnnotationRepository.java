package com.intergiciel.reading_service.repository;

import com.intergiciel.reading_service.domain.ReadingAnnotation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReadingAnnotationRepository extends JpaRepository<ReadingAnnotation, UUID> {

	List<ReadingAnnotation> findByUserIdAndBookIdOrderByCreatedAtAsc(UUID userId, UUID bookId);

	Optional<ReadingAnnotation> findByIdAndUserId(UUID id, UUID userId);
}
