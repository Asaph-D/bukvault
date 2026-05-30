package com.intergiciel.order_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record PurchasedBookResponse(
		UUID bookId,
		String title,
		String coverUrl,
		Instant purchasedAt,
		Long orderId
) {
}
