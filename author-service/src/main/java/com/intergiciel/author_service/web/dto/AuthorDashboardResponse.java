package com.intergiciel.author_service.web.dto;

public record AuthorDashboardResponse(
		long publishedBooksEstimate,
		long draftBooksEstimate,
		String hint
) {
}
