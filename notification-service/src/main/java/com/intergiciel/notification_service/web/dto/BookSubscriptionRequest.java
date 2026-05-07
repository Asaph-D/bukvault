package com.intergiciel.notification_service.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BookSubscriptionRequest(
		@NotNull UUID bookId
) {
}

