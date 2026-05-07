package com.intergiciel.community_service.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record BookLikeRequest(
		@NotNull UUID bookId
) {
}

