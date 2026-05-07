package com.intergiciel.reading_service.security;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public final class JwtUserIds {

	private JwtUserIds() {
	}

	public static UUID requireUserId(Jwt jwt) {
		return UUID.fromString(jwt.getSubject());
	}
}
