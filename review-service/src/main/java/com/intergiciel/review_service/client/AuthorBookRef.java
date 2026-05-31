package com.intergiciel.review_service.client;

import java.util.UUID;

public record AuthorBookRef(
		UUID id,
		String title,
		String coverUrl,
		int reviewCount) {
}
