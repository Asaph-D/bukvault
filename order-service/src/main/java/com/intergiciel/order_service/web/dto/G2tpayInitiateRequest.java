package com.intergiciel.order_service.web.dto;

import com.intergiciel.order_service.domain.MobileMoneyOperator;
import jakarta.validation.constraints.Pattern;

/** Paramètres optionnels pour préremplir la page G2TPay (sinon saisis par l'utilisateur). */
public record G2tpayInitiateRequest(
		@Pattern(regexp = "^$|^(\\+?237|0)?6[0-9]{8}$", message = "Numéro camerounais invalide.")
		String phoneNumber,
		MobileMoneyOperator operator
) {
}
