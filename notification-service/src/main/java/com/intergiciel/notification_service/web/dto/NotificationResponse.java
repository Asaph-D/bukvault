package com.intergiciel.notification_service.web.dto;

import com.intergiciel.notification_service.domain.NotificationKind;

import java.time.Instant;

public record NotificationResponse(
		Long id,
		NotificationKind kind,
		String title,
		String message,
		boolean read,
		Instant createdAt
) {
}
