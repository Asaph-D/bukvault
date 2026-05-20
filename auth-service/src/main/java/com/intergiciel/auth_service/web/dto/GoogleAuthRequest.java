package com.intergiciel.auth_service.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleAuthRequest(
		@NotBlank String idToken,
		/** USER ou AUTHOR — requis à l’inscription Google. */
		@Size(max = 16) String objective,
		/** Obligatoire à l’inscription (conditions d’utilisation). */
		Boolean termsAccepted,
		Boolean rememberMe
) {
}
