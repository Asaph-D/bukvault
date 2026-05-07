package com.intergiciel.order_service.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CartLineResponse(
		Long id,
		UUID bookId,
		int quantity,
		BigDecimal unitPrice,
		String format,
		BigDecimal lineTotal
) {
}
