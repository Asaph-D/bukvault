package com.intergiciel.admin_service.client;

import java.util.List;

public record PlatformCatalogStatsDto(
		long publishedBooks,
		long newPublishedLast30Days,
		long newPublishedPrevious30Days,
		long pendingModeration,
		long totalViews,
		long viewsLast30Days,
		long viewsPrevious30Days,
		List<CategoryShareDto> categoryShares,
		List<TopAuthorViewsDto> topAuthors
) {
}
