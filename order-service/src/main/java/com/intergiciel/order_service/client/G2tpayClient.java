package com.intergiciel.order_service.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.intergiciel.order_service.config.G2tpayProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class G2tpayClient {

	private static final Logger log = LoggerFactory.getLogger(G2tpayClient.class);

	private final RestClient restClient;
	private final G2tpayProperties properties;

	public G2tpayClient(G2tpayProperties properties) {
		this.properties = properties;
		String base = properties.getBaseUrl();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		this.restClient = RestClient.builder().baseUrl(base).build();
	}

	public G2tpayInitiateResult initiate(
			String phoneNumber,
			String operator,
			int amountXaf,
			String description,
			String webhookUrl) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("apiKey", properties.getApiKey());
		body.put("phoneNumber", phoneNumber);
		body.put("operator", operator);
		body.put("description", description);
		body.put("amount", amountXaf);
		if (webhookUrl != null && !webhookUrl.isBlank()) {
			body.put("webhook_url", webhookUrl);
		}
		try {
			JsonNode response = restClient.post()
					.uri("/api/payments/initiate-sdk")
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.body(JsonNode.class);
			if (response == null) {
				throw new ResponseStatusException(
						org.springframework.http.HttpStatus.BAD_GATEWAY,
						"Réponse G2TPay vide.");
			}
			String messageId = firstText(response, "messageId", "MessageId", "message_id");
			String status = firstText(response, "status", "Status");
			log.info("G2TPay initiate OK messageId={} status={}", messageId, status);
			return new G2tpayInitiateResult(messageId, status, response);
		}
		catch (RestClientResponseException ex) {
			log.warn("G2TPay initiate échec HTTP {} : {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
			throw mapG2tpayError(ex);
		}
	}

	public G2tpayStatusResult checkStatus(String messageId) {
		try {
			JsonNode response = restClient.get()
					.uri(uriBuilder -> uriBuilder
							.path("/api/payments/check-status")
							.queryParam("messageId", messageId)
							.build())
					.retrieve()
					.body(JsonNode.class);
			if (response == null) {
				throw new ResponseStatusException(
						org.springframework.http.HttpStatus.BAD_GATEWAY,
						"Réponse G2TPay vide.");
			}
			if (response.has("error")) {
				String error = response.path("error").asText("");
				if (error.toLowerCase().contains("non trouv")) {
					return new G2tpayStatusResult(messageId, "PENDING", response);
				}
			}
			String status = firstText(response, "status", "Status");
			if (status == null && response.has("data")) {
				status = firstText(response.path("data"), "status", "Status");
			}
			return new G2tpayStatusResult(messageId, status != null ? status : "UNKNOWN", response);
		}
		catch (RestClientResponseException ex) {
			log.warn("G2TPay check-status échec HTTP {} : {}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
			throw mapG2tpayError(ex);
		}
	}

	private static ResponseStatusException mapG2tpayError(RestClientResponseException ex) {
		HttpStatusCode code = ex.getStatusCode();
		String body = ex.getResponseBodyAsString();
		String detail = body != null && !body.isBlank() ? body : ex.getMessage();
		if (code.value() == 422) {
			return new ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST,
					"Données de paiement invalides (G2TPay) : " + detail);
		}
		return new ResponseStatusException(
				org.springframework.http.HttpStatus.BAD_GATEWAY,
				"Service G2TPay indisponible : " + detail);
	}

	private static String firstText(JsonNode node, String... fields) {
		for (String field : fields) {
			if (node != null && node.has(field) && !node.get(field).isNull()) {
				String value = node.get(field).asText();
				if (!value.isBlank()) {
					return value;
				}
			}
		}
		return null;
	}

	public record G2tpayInitiateResult(String messageId, String status, JsonNode raw) {
	}

	public record G2tpayStatusResult(String messageId, String status, JsonNode raw) {
	}
}
