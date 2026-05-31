package com.intergiciel.order_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.intergiciel.order_service.client.CatalogBookClient;
import com.intergiciel.order_service.client.CatalogBookDetail;
import com.intergiciel.order_service.client.OrderNotificationClient;
import com.intergiciel.order_service.client.OrderNotificationClient.OrderLineNotification;
import com.intergiciel.order_service.config.G2tpayProperties;
import com.intergiciel.order_service.config.OrderProperties;
import com.intergiciel.order_service.domain.MobileMoneyOperator;
import com.intergiciel.order_service.domain.OrderEntity;
import com.intergiciel.order_service.domain.OrderStatus;
import com.intergiciel.order_service.repository.OrderRepository;
import com.intergiciel.order_service.web.dto.G2tpayInitiateRequest;
import com.intergiciel.order_service.web.dto.G2tpayRedirectResponse;
import com.intergiciel.order_service.web.dto.PaymentStatusResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;
import com.intergiciel.order_service.support.OrderPricing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class G2tpayPaymentService {

	private static final Logger log = LoggerFactory.getLogger(G2tpayPaymentService.class);

	private final OrderRepository orderRepository;
	private final G2tpayProperties g2tpayProperties;
	private final OrderNotificationClient orderNotificationClient;
	private final CatalogBookClient catalogBookClient;
	private final String frontendBaseUrl;

	public G2tpayPaymentService(
			OrderRepository orderRepository,
			G2tpayProperties g2tpayProperties,
			OrderNotificationClient orderNotificationClient,
			CatalogBookClient catalogBookClient,
			OrderProperties orderProperties) {
		this.orderRepository = orderRepository;
		this.g2tpayProperties = g2tpayProperties;
		this.orderNotificationClient = orderNotificationClient;
		this.catalogBookClient = catalogBookClient;
		this.frontendBaseUrl = trimTrailingSlash(orderProperties.getFrontend().getBaseUrl());
	}

	@Transactional
	public G2tpayRedirectResponse buildRedirectUrl(
			Authentication authentication,
			Long orderId,
			G2tpayInitiateRequest request) {
		ensureEnabled();
		String gatewayPublicUrl = trimTrailingSlash(g2tpayProperties.effectiveGatewayPublicUrl());
		if (gatewayPublicUrl.isBlank()) {
			throw new ResponseStatusException(
					HttpStatus.SERVICE_UNAVAILABLE,
					"GATEWAY_PUBLIC_URL ou G2TPAY_WEBHOOK_URL non configurée (tunnel ngrok).");
		}
		UUID userId = com.intergiciel.order_service.support.AuthSupport.userId(authentication);
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		if (order.getStatus() != OrderStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement impossible pour ce statut.");
		}

		int amountXaf = OrderPricing.toXafInt(order.getTotalAmount());
		if (amountXaf < 100) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Montant minimum G2TPay : 100 XAF.");
		}

		order.setPaymentAmountXaf(amountXaf);
		order.setCustomerEmail(com.intergiciel.order_service.support.AuthSupport.email(authentication));
		order.setCustomerFirstName(com.intergiciel.order_service.support.AuthSupport.firstName(authentication));

		if (request != null && request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
			String phone = normalizeCameroonPhone(request.phoneNumber());
			order.setPaymentPhone(phone);
			if (request.operator() != null) {
				order.setPaymentOperator(request.operator());
			}
		}
		orderRepository.save(order);

		String returnUrl = gatewayPublicUrl + "/api/v1/orders/payments/g2tpay/return?orderId=" + order.getId();
		String cancelUrl = frontendBaseUrl + "/checkout/payment";
		String webhookUrl = g2tpayProperties.effectiveWebhookUrl();
		String description = "BookVault commande #" + order.getId();

		Map<String, String> params = new LinkedHashMap<>();
		params.put("api_key", g2tpayProperties.getApiKey());
		params.put("amount", String.valueOf(amountXaf));
		params.put("description", description);
		params.put("return_url", returnUrl);
		params.put("cancel_url", cancelUrl);
		if (webhookUrl != null && !webhookUrl.isBlank()) {
			params.put("webhook_url", webhookUrl);
		}
		if (order.getPaymentPhone() != null && !order.getPaymentPhone().isBlank()) {
			params.put("phone", order.getPaymentPhone());
		}
		if (order.getPaymentOperator() != null) {
			params.put("operator", g2tpayProperties.resolveOperator(order.getPaymentOperator()));
		}

		String redirectUrl = buildIntegratePayUrl(params);
		log.info("G2TPay redirect commande #{} → {} XAF", order.getId(), amountXaf);

		return new G2tpayRedirectResponse(
				order.getId(),
				redirectUrl,
				amountXaf,
				"XAF",
				order.getStatus(),
				"Vous allez être redirigé vers G2TPay pour confirmer le paiement Mobile Money.");
	}

	@Transactional
	public String handleReturn(Long orderId, String status, String messageId, String paymentId) {
		OrderEntity order = orderRepository.findById(orderId).orElse(null);
		if (order == null) {
			log.warn("Return G2TPay : commande #{} introuvable", orderId);
			return frontendBaseUrl + "/checkout/payment?paymentError=order_not_found";
		}
		log.info("Return G2TPay commande #{} status={} message_id={} payment_id={}",
				orderId, status, messageId, paymentId);

		if (order.getStatus() == OrderStatus.PAID) {
			return frontendBaseUrl + "/checkout/confirmation?orderId=" + orderId;
		}
		if (isSuccessful(status)) {
			String reference = messageId != null && !messageId.isBlank()
					? messageId
					: (paymentId != null ? "G2TPAY-" + paymentId : "G2TPAY-" + orderId);
			markPaid(order, reference);
			return frontendBaseUrl + "/checkout/confirmation?orderId=" + orderId;
		}
		return frontendBaseUrl + "/checkout/payment?paymentError=1&orderId=" + orderId
				+ "&status=" + encode(status != null ? status : "UNKNOWN");
	}

	@Transactional(readOnly = true)
	public PaymentStatusResponse paymentStatus(UUID userId, Long orderId) {
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		boolean paid = order.getStatus() == OrderStatus.PAID;
		return new PaymentStatusResponse(
				order.getId(),
				order.getStatus(),
				order.getPaymentReference(),
				paid ? "SUCCESSFUL" : "PENDING",
				paid);
	}

	@Transactional
	public void handleWebhook(JsonNode body) {
		if (body == null || body.isEmpty()) {
			log.warn("Webhook G2TPay vide ignoré");
			return;
		}
		String messageId = extractMessageId(body);
		String status = extractStatus(body);
		if (messageId == null || messageId.isBlank()) {
			log.warn("Webhook G2TPay sans messageId : {}", body);
			return;
		}
		OrderEntity order = orderRepository.findByPaymentReference(messageId).orElse(null);
		if (order == null) {
			log.warn("Webhook G2TPay : commande introuvable pour messageId={}", messageId);
			return;
		}
		if (order.getStatus() == OrderStatus.PAID) {
			return;
		}
		if (isSuccessful(status)) {
			markPaid(order, messageId);
			log.info("Commande #{} marquée PAID via webhook G2TPay", order.getId());
		}
	}

	private String buildIntegratePayUrl(Map<String, String> params) {
		String base = trimTrailingSlash(g2tpayProperties.getBaseUrl());
		UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(base + "/integrate/pay");
		params.forEach(builder::queryParam);
		return builder.encode(StandardCharsets.UTF_8).build().toUriString();
	}

	private void markPaid(OrderEntity order, String paymentReference) {
		order.setStatus(OrderStatus.PAID);
		order.setPaymentReference(paymentReference);
		orderRepository.save(order);
		orderNotificationClient.sendOrderConfirmed(
				order.getUserId(),
				order.getCustomerEmail(),
				order.getCustomerFirstName(),
				order.getId(),
				order.getTotalAmount(),
				order.getCurrency(),
				buildNotificationLines(order));
	}

	private void ensureEnabled() {
		if (!g2tpayProperties.isEnabled()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement G2TPay désactivé.");
		}
		if (g2tpayProperties.getApiKey() == null || g2tpayProperties.getApiKey().isBlank()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Clé API G2TPay absente.");
		}
	}

	static String normalizeCameroonPhone(String raw) {
		String digits = raw.replaceAll("\\D", "");
		if (digits.startsWith("237") && digits.length() == 12) {
			return digits;
		}
		if (digits.startsWith("0") && digits.length() == 10) {
			return "237" + digits.substring(1);
		}
		if (digits.length() == 9 && digits.startsWith("6")) {
			return "237" + digits;
		}
		throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numéro camerounais invalide.");
	}

	static boolean isSuccessful(String status) {
		if (status == null) {
			return false;
		}
		String normalized = status.trim().toUpperCase(Locale.ROOT);
		return normalized.equals("SUCCESSFUL")
				|| normalized.equals("SUCCESS")
				|| normalized.equals("COMPLETED")
				|| normalized.equals("PAID");
	}

	private static String extractMessageId(JsonNode body) {
		if (body.hasNonNull("MessageId")) {
			return body.get("MessageId").asText();
		}
		if (body.hasNonNull("messageId")) {
			return body.get("messageId").asText();
		}
		if (body.has("parameters") && body.path("parameters").hasNonNull("MessageId")) {
			return body.path("parameters").get("MessageId").asText();
		}
		if (body.has("data") && body.path("data").hasNonNull("txnid")) {
			return body.path("data").get("txnid").asText();
		}
		return null;
	}

	private static String extractStatus(JsonNode body) {
		if (body.hasNonNull("Status")) {
			return body.get("Status").asText();
		}
		if (body.hasNonNull("status")) {
			return body.get("status").asText();
		}
		if (body.has("data") && body.path("data").hasNonNull("status")) {
			return body.path("data").get("status").asText();
		}
		return null;
	}

	private List<OrderLineNotification> buildNotificationLines(OrderEntity order) {
		return order.getLines().stream()
				.map(line -> {
					CatalogBookDetail detail = catalogBookClient.fetchBookDetail(line.getBookId());
					String title = detail != null && detail.title() != null && !detail.title().isBlank()
							? detail.title()
							: "Livre " + line.getBookId().toString().substring(0, 8);
					String readUrl = frontendBaseUrl + "/books/" + line.getBookId();
					return new OrderLineNotification(line.getBookId(), title, readUrl);
				})
				.toList();
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static String trimTrailingSlash(String url) {
		if (url == null || url.isBlank()) {
			return "";
		}
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}
}
