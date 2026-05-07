package com.intergiciel.auth_service.web.dto;

public record AuthResponse(
		UserResponse user,
		String accessToken,
		String refreshToken,
		long expiresIn,
		String tokenType
) {
	public static AuthResponse of(UserResponse user, String accessToken, String refreshToken, long expiresInSeconds) {
		return new AuthResponse(user, accessToken, refreshToken, expiresInSeconds, "Bearer");
	}
}
