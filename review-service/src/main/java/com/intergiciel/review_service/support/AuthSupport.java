package com.intergiciel.review_service.support;

import com.intergiciel.review_service.web.dto.ReviewerProfile;
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

	public static ReviewerProfile reviewerProfile(Authentication authentication, String apiPublicBaseUrl) {
		if (!(authentication instanceof JwtAuthenticationToken jwt)) {
			throw new IllegalStateException("JWT attendu.");
		}
		UUID userId = UUID.fromString(jwt.getName());
		String email = claim(jwt, "email");
		String firstName = claim(jwt, "firstName");
		String lastName = claim(jwt, "lastName");
		if (email == null || email.isBlank()) {
			email = userId + "@bookvault.local";
		}
		String display = ((firstName != null ? firstName : "Lecteur") + " " + (lastName != null ? lastName : "")).trim();
		if (display.isBlank()) {
			display = email;
		}
		String base = apiPublicBaseUrl.replaceAll("/+$", "");
		String avatarUrl = base + "/api/v1/files/avatar/" + userId;
		return new ReviewerProfile(userId, email, display, avatarUrl);
	}

	public static boolean isAdmin(Authentication authentication) {
		return authentication.getAuthorities().stream()
				.anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
	}

	private static String claim(JwtAuthenticationToken jwt, String name) {
		return jwt.getToken().getClaimAsString(name);
	}
}
