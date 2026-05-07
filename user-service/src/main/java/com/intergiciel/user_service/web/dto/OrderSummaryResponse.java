package com.intergiciel.user_service.web.dto;

import java.util.UUID;

/**
 * Placeholder — les commandes réelles seront servies par order-service (agrégation future).
 */
public record OrderSummaryResponse(
		UUID id,
		String status
) {
}
