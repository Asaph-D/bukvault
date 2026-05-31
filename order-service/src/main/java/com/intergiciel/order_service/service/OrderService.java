package com.intergiciel.order_service.service;

import com.intergiciel.order_service.client.CatalogBookClient;
import com.intergiciel.order_service.client.CatalogBookDetail;
import com.intergiciel.order_service.client.OrderNotificationClient;
import com.intergiciel.order_service.client.OrderNotificationClient.OrderLineNotification;
import com.intergiciel.order_service.config.G2tpayProperties;
import com.intergiciel.order_service.config.OrderProperties;
import com.intergiciel.order_service.domain.CartLineEntity;
import com.intergiciel.order_service.domain.OrderEntity;
import com.intergiciel.order_service.domain.OrderLineEntity;
import com.intergiciel.order_service.domain.OrderStatus;
import com.intergiciel.order_service.repository.CartLineRepository;
import com.intergiciel.order_service.repository.OrderRepository;
import com.intergiciel.order_service.web.dto.OrderLineResponse;
import com.intergiciel.order_service.web.dto.OrderResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import com.intergiciel.order_service.support.AuthSupport;
import com.intergiciel.order_service.support.OrderPricing;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

	private final OrderRepository orderRepository;
	private final CartLineRepository cartLineRepository;
	private final CatalogBookClient catalogBookClient;
	private final OrderNotificationClient orderNotificationClient;
	private final G2tpayProperties g2tpayProperties;
	private final String frontendBaseUrl;

	public OrderService(
			OrderRepository orderRepository,
			CartLineRepository cartLineRepository,
			CatalogBookClient catalogBookClient,
			OrderNotificationClient orderNotificationClient,
			OrderProperties orderProperties,
			G2tpayProperties g2tpayProperties) {
		this.orderRepository = orderRepository;
		this.cartLineRepository = cartLineRepository;
		this.catalogBookClient = catalogBookClient;
		this.orderNotificationClient = orderNotificationClient;
		this.g2tpayProperties = g2tpayProperties;
		this.frontendBaseUrl = trimTrailingSlash(orderProperties.getFrontend().getBaseUrl());
	}

	@Transactional(readOnly = true)
	public Page<OrderResponse> listForUser(UUID userId, Pageable pageable) {
		return orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
				.map(this::toResponse);
	}

	@Transactional(readOnly = true)
	public OrderResponse getForUser(UUID userId, Long orderId) {
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		return toResponse(order);
	}

	@Transactional
	public OrderResponse createFromCart(UUID userId) {
		List<CartLineEntity> lines = cartLineRepository.findByUserIdOrderById(userId);
		if (lines.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Panier vide.");
		}
		OrderEntity order = new OrderEntity(userId);
		BigDecimal total = BigDecimal.ZERO;
		for (CartLineEntity cl : lines) {
			BigDecimal lineTotal = cl.getUnitPrice().multiply(BigDecimal.valueOf(cl.getQuantity()));
			total = total.add(lineTotal);
			order.addLine(new OrderLineEntity(cl.getBookId(), cl.getQuantity(), cl.getUnitPrice(), cl.getFormat()));
		}
		order.setTotalAmount(OrderPricing.checkoutTotal(total));
		order.setCurrency(OrderPricing.CURRENCY);
		OrderEntity saved = orderRepository.save(order);
		cartLineRepository.deleteByUserId(userId);
		return toResponse(saved);
	}

	@Transactional
	public OrderResponse pay(Authentication authentication, Long orderId) {
		if (g2tpayProperties.isEnabled()) {
			throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Paiement simulé désactivé. Utilisez Mobile Money via G2TPay.");
		}
		UUID userId = AuthSupport.userId(authentication);
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		if (order.getStatus() != OrderStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Paiement impossible pour ce statut.");
		}
		order.setStatus(OrderStatus.PAID);
		order.setPaymentReference("MOCK-" + UUID.randomUUID());
		order.setCustomerEmail(AuthSupport.email(authentication));
		order.setCustomerFirstName(AuthSupport.firstName(authentication));
		OrderEntity saved = orderRepository.save(order);
		OrderResponse response = toResponse(saved);
		orderNotificationClient.sendOrderConfirmed(
				userId,
				AuthSupport.email(authentication),
				AuthSupport.firstName(authentication),
				saved.getId(),
				saved.getTotalAmount(),
				saved.getCurrency(),
				buildNotificationLines(saved));
		return response;
	}

	@Transactional
	public OrderResponse cancel(UUID userId, Long orderId) {
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		if (order.getStatus() != OrderStatus.PENDING) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Annulation réservée aux commandes en attente.");
		}
		order.setStatus(OrderStatus.CANCELLED);
		return toResponse(orderRepository.save(order));
	}

	@Transactional(readOnly = true)
	public String invoiceText(UUID userId, Long orderId) {
		OrderEntity order = orderRepository.findByIdAndUserId(orderId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commande introuvable."));
		StringBuilder sb = new StringBuilder();
		sb.append("Facture BookVault — commande #").append(order.getId()).append("\n");
		sb.append("Client: ").append(order.getUserId()).append("\n");
		sb.append("Statut: ").append(order.getStatus()).append("\n");
		sb.append("Total TTC: ").append(order.getTotalAmount()).append(" ").append(order.getCurrency()).append("\n");
		sb.append("Lignes:\n");
		for (OrderLineEntity line : order.getLines()) {
			sb.append("  - Livre ").append(line.getBookId())
					.append(" x").append(line.getQuantity())
					.append(" @ ").append(line.getUnitPrice()).append("\n");
		}
		if (order.getPaymentReference() != null) {
			sb.append("Réf. paiement: ").append(order.getPaymentReference()).append("\n");
		}
		return sb.toString();
	}

	private OrderResponse toResponse(OrderEntity order) {
		List<OrderLineResponse> lineDtos = order.getLines().stream()
				.map(this::lineToResponse)
				.toList();
		return new OrderResponse(
				order.getId(),
				order.getUserId(),
				order.getStatus(),
				order.getTotalAmount(),
				order.getCurrency(),
				order.getPaymentReference(),
				order.getCreatedAt(),
				order.getUpdatedAt(),
				lineDtos);
	}

	private OrderLineResponse lineToResponse(OrderLineEntity line) {
		BigDecimal total = line.getUnitPrice().multiply(BigDecimal.valueOf(line.getQuantity()));
		return new OrderLineResponse(
				line.getId(),
				line.getBookId(),
				line.getQuantity(),
				line.getUnitPrice(),
				line.getFormat(),
				total);
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

	private static String trimTrailingSlash(String url) {
		if (url == null || url.isBlank()) {
			return "http://localhost:4200";
		}
		return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
	}
}
