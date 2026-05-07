package com.intergiciel.user_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
		@NotBlank @Size(max = 120) String firstName,
		@NotBlank @Size(max = 120) String lastName,
		@Size(max = 4000) String bio,
		@Size(max = 2000) String avatarUrl,
		@Size(max = 32) String preferredLanguage,
		boolean newsletter
) {
}
