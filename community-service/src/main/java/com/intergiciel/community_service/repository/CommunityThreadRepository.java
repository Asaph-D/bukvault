package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.CommunityThreadEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommunityThreadRepository extends JpaRepository<CommunityThreadEntity, UUID> {

	List<CommunityThreadEntity> findAllByOrderBySortIndexAsc();
}
