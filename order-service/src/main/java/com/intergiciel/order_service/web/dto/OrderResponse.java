package com.intergiciel.order_service.web.dto;

import com.intergiciel.order_service.domain.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
		Long id,
		UUID userId,
		OrderStatus status,
		BigDecimal totalAmount,
		String currency,
		String paymentReference,
		Instant createdAt,
		Instant updatedAt,
		List<OrderLineResponse> lines
) {
}
