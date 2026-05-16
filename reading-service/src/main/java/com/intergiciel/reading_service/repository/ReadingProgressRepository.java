package com.intergiciel.reading_service.repository;

import com.intergiciel.reading_service.domain.ReadingProgress;
import com.intergiciel.reading_service.domain.ReadingProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ReadingProgressRepository extends JpaRepository<ReadingProgress, ReadingProgressId> {

	List<ReadingProgress> findByIdUserIdOrderByIdBookIdAsc(UUID userId);

	@Query(value = """
			SELECT CAST(server_updated_at AS date) AS day, COUNT(*) AS cnt
			FROM reading_progress
			WHERE server_updated_at >= :since
			GROUP BY day
			ORDER BY day
			""", nativeQuery = true)
	List<Object[]> countUpdatesGroupedByDay(@Param("since") Instant since);

	@Query(value = """
			SELECT EXTRACT(DOW FROM server_updated_at AT TIME ZONE 'UTC')::int AS dow, COUNT(*) AS cnt
			FROM reading_progress
			WHERE server_updated_at >= :since
			GROUP BY dow
			ORDER BY dow
			""", nativeQuery = true)
	List<Object[]> countUpdatesGroupedByWeekday(@Param("since") Instant since);
}
