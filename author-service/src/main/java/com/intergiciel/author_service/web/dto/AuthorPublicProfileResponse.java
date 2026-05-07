package com.intergiciel.author_service.web.dto;

import java.util.UUID;

public record AuthorPublicProfileResponse(
		UUID authorId,
		String penName,
		String website,
		String bio,
		long publishedBooksEstimate
) {
}
