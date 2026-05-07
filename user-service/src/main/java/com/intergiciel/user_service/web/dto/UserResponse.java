package com.intergiciel.user_service.web.dto;

import com.intergiciel.user_service.domain.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
		UUID id,
		String email,
		String firstName,
		String lastName,
		Role role,
		boolean active,
		String bio,
		String avatarUrl,
		String preferredLanguage,
		boolean newsletter,
		Instant createdAt,
		Instant updatedAt
) {
}
