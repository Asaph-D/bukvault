package com.intergiciel.catalog_service.web.dto;

import java.util.List;

public record PlatformCatalogStatsResponse(
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
