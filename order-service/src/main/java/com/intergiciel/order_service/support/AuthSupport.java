package com.intergiciel.order_service.support;

import org.springframework.security.access.AccessDeniedException;
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
		throw new AccessDeniedException("Authentification JWT requise.");
	}

	public static String email(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken jwt) {
			Object claim = jwt.getToken().getClaim("email");
			return claim != null ? claim.toString() : null;
		}
		throw new AccessDeniedException("Authentification JWT requise.");
	}

	public static String firstName(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken jwt) {
			Object claim = jwt.getToken().getClaim("firstName");
			return claim != null ? claim.toString() : "";
		}
		throw new AccessDeniedException("Authentification JWT requise.");
	}
}
