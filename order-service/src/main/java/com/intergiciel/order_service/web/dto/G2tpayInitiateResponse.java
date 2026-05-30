package com.intergiciel.order_service.web.dto;

import com.intergiciel.order_service.domain.MobileMoneyOperator;
import com.intergiciel.order_service.domain.OrderStatus;

public record G2tpayInitiateResponse(
		Long orderId,
		String messageId,
		String providerStatus,
		int amountXaf,
		String currency,
		MobileMoneyOperator operator,
		String phoneNumber,
		OrderStatus orderStatus,
		String instruction
) {
}
