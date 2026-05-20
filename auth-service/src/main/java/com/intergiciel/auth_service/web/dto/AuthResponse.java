package com.intergiciel.auth_service.web.dto;

public record AuthResponse(
		UserResponse user,
		String accessToken,
		String refreshToken,
		long expiresIn,
		String tokenType,
		/** true : pas de jetons — l’utilisateur doit confirmer son e-mail. */
		boolean emailVerificationRequired
) {
	public static AuthResponse withTokens(UserResponse user, String accessToken, String refreshToken,
			long expiresInSeconds) {
		return new AuthResponse(user, accessToken, refreshToken, expiresInSeconds, "Bearer", false);
	}

	public static AuthResponse pendingEmailVerification(UserResponse user) {
		return new AuthResponse(user, null, null, 0, "Bearer", true);
	}
}
