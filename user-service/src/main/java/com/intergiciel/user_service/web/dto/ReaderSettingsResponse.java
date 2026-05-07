package com.intergiciel.user_service.web.dto;

import com.intergiciel.user_service.domain.CommunityVisibility;
import com.intergiciel.user_service.domain.ReaderHomeDefault;
import com.intergiciel.user_service.domain.ThemePreference;
import com.intergiciel.user_service.domain.UiDensity;

import java.time.Instant;

public record ReaderSettingsResponse(
		ThemePreference theme,
		UiDensity uiDensity,
		String localeOverride,
		boolean notifyOrders,
		boolean notifyPromotions,
		boolean notifySocial,
		CommunityVisibility communityVisibility,
		boolean allowDirectMessages,
		ReaderHomeDefault readerHomeDefault,
		boolean libraryShowProgress,
		boolean reduceMotion,
		Instant updatedAt
) {
}
