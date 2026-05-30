package com.intergiciel.order_service.web.dto;

import java.math.BigDecimal;

public record SalesAggregateResponse(
		long totalUnitsSold,
		BigDecimal revenue
) {
}
