package com.intergiciel.order_service.web.dto;

import com.intergiciel.order_service.domain.OrderStatus;

public record PaymentStatusResponse(
		Long orderId,
		OrderStatus orderStatus,
		String messageId,
		String providerStatus,
		boolean paid
) {
}
