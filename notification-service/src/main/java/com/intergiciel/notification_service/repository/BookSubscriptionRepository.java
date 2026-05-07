package com.intergiciel.notification_service.repository;

import com.intergiciel.notification_service.domain.BookSubscriptionEntity;
import com.intergiciel.notification_service.domain.BookSubscriptionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookSubscriptionRepository extends JpaRepository<BookSubscriptionEntity, BookSubscriptionId> {
}

