package com.intergiciel.reading_service.repository;

import com.intergiciel.reading_service.domain.ReadingProgress;
import com.intergiciel.reading_service.domain.ReadingProgressId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, ReadingProgressId> {

	List<ReadingProgress> findByIdUserIdOrderByIdBookIdAsc(UUID userId);
}
