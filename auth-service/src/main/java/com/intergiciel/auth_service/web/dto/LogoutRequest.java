package com.intergiciel.auth_service.web.dto;

/**
 * Optionnel : si renseigné, révoque uniquement ce refresh ; sinon révoque tous les refresh du compte.
 */
public record LogoutRequest(
		String refreshToken
) {
}
