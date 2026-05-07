package com.intergiciel.auth_service.web.dto;

import com.intergiciel.auth_service.domain.Role;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
		UUID id,
		String email,
		String firstName,
		String lastName,
		Role role,
		boolean active,
		Instant createdAt
) {
}
