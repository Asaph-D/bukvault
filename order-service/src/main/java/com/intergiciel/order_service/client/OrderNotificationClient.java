package com.intergiciel.order_service.client;

import com.intergiciel.order_service.config.OrderProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class OrderNotificationClient {

	private static final Logger log = LoggerFactory.getLogger(OrderNotificationClient.class);

	private final RestClient restClient;
	private final String internalKey;
	private final String frontendBaseUrl;

	public OrderNotificationClient(OrderProperties orderProperties) {
		String base = orderProperties.getNotification().getBaseUrl();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		this.restClient = RestClient.builder().baseUrl(base).build();
		this.internalKey = orderProperties.getNotification().getInternalKey();
		this.frontendBaseUrl = trimTrailingSlash(orderProperties.getFrontend().getBaseUrl());
	}

	public void sendOrderConfirmed(
			UUID userId,
			String recipientEmail,
			String firstName,
			long orderId,
			BigDecimal totalAmount,
			String currency,
			List<OrderLineNotification> lines) {
		if (internalKey == null || internalKey.isBlank()) {
			log.warn("BOOKVAULT_INTERNAL_SERVICE_KEY absente — confirmation commande #{} non envoyée", orderId);
			return;
		}
		if (recipientEmail == null || recipientEmail.isBlank()) {
			log.warn("E-mail absent — confirmation commande #{} non envoyée", orderId);
			return;
		}
		try {
			String libraryUrl = frontendBaseUrl + "/dashboard/reader/library";
			List<Map<String, Object>> linePayload = lines.stream()
					.map(line -> Map.<String, Object>of(
							"bookId", line.bookId().toString(),
							"bookTitle", line.bookTitle(),
							"readUrl", line.readUrl()))
					.toList();
			Map<String, Object> body = Map.of(
					"userId", userId.toString(),
					"recipientEmail", recipientEmail,
					"firstName", firstName != null ? firstName : "",
					"orderId", orderId,
					"totalAmount", totalAmount,
					"currency", currency,
					"libraryUrl", libraryUrl,
					"lines", linePayload);
			restClient.post()
					.uri("/api/v1/notifications/internal/order-confirmed")
					.headers(h -> {
						h.setContentType(MediaType.APPLICATION_JSON);
						h.set("X-BookVault-Internal-Key", internalKey);
					})
					.body(body)
					.retrieve()
					.toBodilessEntity();
			log.info("Demande de confirmation commande #{} envoyée pour {}", orderId, recipientEmail);
		}
		catch (Exception ex) {
			log.error("Échec envoi confirmation commande #{} : {}", orderId, ex.getMessage());
		}
	}

	public record OrderLineNotification(UUID bookId, String bookTitle, String readUrl) {
	}

	private static String trimTrailingSlash(String url) {
		if (url == null || url.isBlank()) {
			return "http://localhost:4200";
		}
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}
}
