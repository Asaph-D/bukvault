package com.intergiciel.author_service.client;

import java.math.BigDecimal;

public record SalesAggregateResponse(
		long totalUnitsSold,
		BigDecimal revenue
) {
}
