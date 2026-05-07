package com.intergiciel.catalog_service.service;

import com.intergiciel.catalog_service.domain.Book;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public final class CatalogAccess {

	private CatalogAccess() {
	}

	public static boolean canEditBook(Book book, Jwt jwt) {
		if (jwt == null) {
			return false;
		}
		UUID uid = UUID.fromString(jwt.getSubject());
		String role = jwt.getClaimAsString("role");
		if ("ADMIN".equals(role)) {
			return true;
		}
		return "AUTHOR".equals(role) && book.getAuthorUserId().equals(uid);
	}

	public static boolean canCreateBook(Jwt jwt) {
		if (jwt == null) {
			return false;
		}
		String role = jwt.getClaimAsString("role");
		return "AUTHOR".equals(role) || "ADMIN".equals(role);
	}

	public static boolean isAdmin(Jwt jwt) {
		return jwt != null && "ADMIN".equals(jwt.getClaimAsString("role"));
	}

	public static UUID userId(Jwt jwt) {
		return UUID.fromString(jwt.getSubject());
	}
}
