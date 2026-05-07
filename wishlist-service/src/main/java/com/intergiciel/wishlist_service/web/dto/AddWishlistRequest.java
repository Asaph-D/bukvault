package com.intergiciel.wishlist_service.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddWishlistRequest(@NotNull UUID bookId) {
}
