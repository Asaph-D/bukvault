package com.intergiciel.review_service.support;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.UUID;

public final class AuthSupport {

	private AuthSupport() {
	}

	public static UUID userId(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken jwt) {
			return UUID.fromString(jwt.getName());
		}
		throw new IllegalStateException("JWT attendu.");
	}

	public static boolean isAdmin(Authentication authentication) {
		return authentication.getAuthorities().stream()
				.anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
	}
}
