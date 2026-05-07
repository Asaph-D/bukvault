package com.intergiciel.notification_service.web.dto;

import jakarta.validation.constraints.NotNull;

public record PreferencesUpdateRequest(
		@NotNull Boolean emailEnabled,
		@NotNull Boolean inAppEnabled,
		@NotNull Boolean marketingEnabled
) {
}
