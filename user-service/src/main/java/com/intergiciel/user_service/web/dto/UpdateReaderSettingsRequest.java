package com.intergiciel.user_service.web.dto;

import com.intergiciel.user_service.domain.CommunityVisibility;
import com.intergiciel.user_service.domain.ReaderHomeDefault;
import com.intergiciel.user_service.domain.ThemePreference;
import com.intergiciel.user_service.domain.UiDensity;
import jakarta.validation.constraints.NotNull;

public record UpdateReaderSettingsRequest(
		@NotNull ThemePreference theme,
		@NotNull UiDensity uiDensity,
		String localeOverride,
		boolean notifyOrders,
		boolean notifyPromotions,
		boolean notifySocial,
		@NotNull CommunityVisibility communityVisibility,
		boolean allowDirectMessages,
		@NotNull ReaderHomeDefault readerHomeDefault,
		boolean libraryShowProgress,
		boolean reduceMotion
) {
}
