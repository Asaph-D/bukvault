package com.intergiciel.wishlist_service.web.dto;

import java.util.List;
import java.util.UUID;

public record MoveToCartResponse(
		List<UUID> addedToCart,
		List<String> errors
) {
}
