package com.intergiciel.wishlist_service.web.dto;

import java.time.Instant;
import java.util.UUID;

public record WishlistItemResponse(Long id, UUID bookId, Instant addedAt) {
}
