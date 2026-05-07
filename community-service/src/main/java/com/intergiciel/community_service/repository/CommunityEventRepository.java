package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.CommunityEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommunityEventRepository extends JpaRepository<CommunityEventEntity, UUID> {

	List<CommunityEventEntity> findAllByOrderBySortIndexAsc();
}
