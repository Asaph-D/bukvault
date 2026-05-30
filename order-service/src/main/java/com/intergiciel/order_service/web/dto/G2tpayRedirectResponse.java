package com.intergiciel.order_service.web.dto;

import com.intergiciel.order_service.domain.OrderStatus;

public record G2tpayRedirectResponse(
		Long orderId,
		String redirectUrl,
		int amountXaf,
		String currency,
		OrderStatus orderStatus,
		String instruction
) {
}
