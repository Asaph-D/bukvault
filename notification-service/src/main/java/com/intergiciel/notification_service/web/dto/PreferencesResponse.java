package com.intergiciel.notification_service.web.dto;

public record PreferencesResponse(
		boolean emailEnabled,
		boolean inAppEnabled,
		boolean marketingEnabled
) {
}
