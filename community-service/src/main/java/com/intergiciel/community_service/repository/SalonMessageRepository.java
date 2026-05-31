package com.intergiciel.community_service.repository;

import com.intergiciel.community_service.domain.SalonMessageEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SalonMessageRepository extends JpaRepository<SalonMessageEntity, UUID> {

	Page<SalonMessageEntity> findByThreadIdOrderByCreatedAtDesc(UUID threadId, Pageable pageable);
}
