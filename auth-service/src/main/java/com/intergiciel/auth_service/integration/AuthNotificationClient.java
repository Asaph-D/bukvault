package com.intergiciel.auth_service.integration;

import com.intergiciel.auth_service.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class AuthNotificationClient {

	private static final Logger log = LoggerFactory.getLogger(AuthNotificationClient.class);

	private final RestClient restClient;
	private final String internalKey;

	public AuthNotificationClient(AppProperties appProperties) {
		String base = appProperties.getNotification().getServiceUrl();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		this.restClient = RestClient.builder().baseUrl(base).build();
		this.internalKey = appProperties.getNotification().getInternalKey();
	}

	public void sendEmailVerification(String to, String firstName, String verifyUrl) {
		if (internalKey == null || internalKey.isBlank()) {
			log.warn("BOOKVAULT_INTERNAL_SERVICE_KEY absente — e-mail de vérification non envoyé à {}", to);
			return;
		}
		try {
			Map<String, String> body = Map.of(
					"recipientEmail", to,
					"firstName", firstName != null ? firstName : "",
					"verifyUrl", verifyUrl);
			restClient.post()
					.uri("/api/v1/notifications/internal/email-verification")
					.headers(h -> {
						h.setContentType(MediaType.APPLICATION_JSON);
						h.set("X-BookVault-Internal-Key", internalKey);
					})
					.body(body)
					.retrieve()
					.toBodilessEntity();
			log.info("Demande d’e-mail de vérification envoyée pour {}", to);
		}
		catch (Exception ex) {
			log.error("Échec envoi e-mail vérification à {} : {}", to, ex.getMessage());
		}
	}
}
