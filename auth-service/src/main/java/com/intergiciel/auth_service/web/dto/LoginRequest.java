package com.intergiciel.auth_service.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
		@NotBlank @Email String email,
		@NotBlank String password,
		/** Si true, on prolonge la durée du refresh token (session “longue”). */
		Boolean rememberMe
) {
}
