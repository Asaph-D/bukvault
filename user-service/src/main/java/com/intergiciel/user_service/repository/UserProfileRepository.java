package com.intergiciel.user_service.repository;

import com.intergiciel.user_service.domain.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface UserProfileRepository extends JpaRepository<UserProfile, UUID>, JpaSpecificationExecutor<UserProfile> {

	long countByCreatedAtGreaterThanEqual(Instant since);

	long countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(Instant startInclusive, Instant endExclusive);

	@Query(value = """
			SELECT CAST(created_at AS date) AS day, COUNT(*) AS cnt
			FROM user_profiles
			WHERE created_at >= :since
			GROUP BY day
			ORDER BY day
			""", nativeQuery = true)
	List<Object[]> countRegistrationsGroupedByDay(@Param("since") Instant since);
}
