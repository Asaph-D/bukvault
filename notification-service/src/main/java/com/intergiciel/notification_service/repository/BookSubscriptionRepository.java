package com.intergiciel.notification_service.repository;

import com.intergiciel.notification_service.domain.BookSubscriptionEntity;
import com.intergiciel.notification_service.domain.BookSubscriptionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface BookSubscriptionRepository extends JpaRepository<BookSubscriptionEntity, BookSubscriptionId> {

	@Query("select b from BookSubscriptionEntity b where b.id.userId = :userId order by b.createdAt desc")
	List<BookSubscriptionEntity> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);
}

