package com.intergiciel.notification_service.repository;

import com.intergiciel.notification_service.domain.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

	Page<NotificationEntity> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

	Optional<NotificationEntity> findByIdAndUserId(Long id, UUID userId);

	@Modifying(clearAutomatically = true)
	@Query("update NotificationEntity n set n.readFlag = true where n.userId = :userId and n.readFlag = false")
	int markAllReadForUser(@Param("userId") UUID userId);
}
