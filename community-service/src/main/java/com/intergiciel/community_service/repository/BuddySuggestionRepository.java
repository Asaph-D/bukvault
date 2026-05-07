package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.BuddySuggestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuddySuggestionRepository extends JpaRepository<BuddySuggestionEntity, UUID> {

	List<BuddySuggestionEntity> findByViewerUserIdOrderBySortIndexAsc(UUID viewerUserId);
}
