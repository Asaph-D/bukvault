package com.intergiciel.reading_service.repository;

import com.intergiciel.reading_service.domain.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookmarkRepository extends JpaRepository<Bookmark, UUID> {

	List<Bookmark> findByUserIdAndBookIdOrderByCreatedAtDesc(UUID userId, UUID bookId);

	Optional<Bookmark> findByIdAndUserId(UUID id, UUID userId);
}
