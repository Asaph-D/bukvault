package com.intergiciel.wishlist_service.client;

import java.util.UUID;

/**
 * Corps aligné sur order-service {@code AddToCartRequest}.
 */
public record CartAddPayload(UUID bookId, int quantity, String format) {
}
