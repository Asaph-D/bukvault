package com.intergiciel.notification_service.repository;

import com.intergiciel.notification_service.domain.NotificationPreferencesEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferencesEntity, UUID> {
}
