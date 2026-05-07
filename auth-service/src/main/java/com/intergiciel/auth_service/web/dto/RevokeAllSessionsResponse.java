package com.intergiciel.auth_service.web.dto;

public record RevokeAllSessionsResponse(
		int revokedRefreshTokens
) {
}

