package com.intergiciel.order_service.web.dto;

public record G2tpayConfigResponse(
		boolean enabled,
		String currency,
		String instruction
) {
}
