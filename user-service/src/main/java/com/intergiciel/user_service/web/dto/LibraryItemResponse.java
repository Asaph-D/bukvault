package com.intergiciel.user_service.web.dto;

import java.util.UUID;

/**
 * Placeholder bibliothèque numérique — détail à brancher sur catalog/file/order.
 */
public record LibraryItemResponse(
		UUID bookId,
		String title
) {
}
