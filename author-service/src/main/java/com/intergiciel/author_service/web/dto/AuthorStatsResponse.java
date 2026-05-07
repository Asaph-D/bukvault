package com.intergiciel.author_service.web.dto;

import java.math.BigDecimal;

public record AuthorStatsResponse(
		long totalSalesEstimate,
		BigDecimal revenueEstimate,
		String note
) {
}
