package com.intergiciel.notification_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record BookSubscriptionItemResponse(
		UUID bookId,
		Instant subscribedAt
) {
}
