package com.intergiciel.review_service.web.dto;

import java.util.UUID;

public record ReviewerProfile(
		UUID userId,
		String email,
		String displayName,
		String avatarUrl) {
}
