package com.intergiciel.order_service.web;

import com.intergiciel.order_service.service.G2tpayPaymentService;
import com.intergiciel.order_service.service.OrderService;
import com.intergiciel.order_service.service.PurchasedLibraryService;
import com.intergiciel.order_service.support.AuthSupport;
import com.intergiciel.order_service.web.dto.G2tpayConfigResponse;
import com.intergiciel.order_service.web.dto.G2tpayRedirectResponse;
import com.intergiciel.order_service.web.dto.G2tpayInitiateRequest;
import com.intergiciel.order_service.web.dto.OrderResponse;
import com.intergiciel.order_service.web.dto.PaymentStatusResponse;
import com.intergiciel.order_service.web.dto.PurchasedBookResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.intergiciel.order_service.config.G2tpayProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Commandes")
public class OrderController {

	private final OrderService orderService;
	private final PurchasedLibraryService purchasedLibraryService;
	private final G2tpayPaymentService g2tpayPaymentService;
	private final G2tpayProperties g2tpayProperties;

	public OrderController(
			OrderService orderService,
			PurchasedLibraryService purchasedLibraryService,
			G2tpayPaymentService g2tpayPaymentService,
			G2tpayProperties g2tpayProperties) {
		this.orderService = orderService;
		this.purchasedLibraryService = purchasedLibraryService;
		this.g2tpayPaymentService = g2tpayPaymentService;
		this.g2tpayProperties = g2tpayProperties;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Créer une commande à partir du panier")
	public OrderResponse create(Authentication authentication) {
		return orderService.createFromCart(AuthSupport.userId(authentication));
	}

	@GetMapping
	@Operation(summary = "Mes commandes")
	public Page<OrderResponse> list(Authentication authentication,
			@PageableDefault(size = 20) Pageable pageable) {
		return orderService.listForUser(AuthSupport.userId(authentication), pageable);
	}

	@GetMapping("/my-library")
	@Operation(summary = "Mes livres achetés (numériques)")
	public List<PurchasedBookResponse> myLibrary(Authentication authentication) {
		return purchasedLibraryService.listForUser(AuthSupport.userId(authentication));
	}

	@GetMapping("/{id}")
	@Operation(summary = "Détail commande")
	public OrderResponse getOne(Authentication authentication, @PathVariable Long id) {
		return orderService.getForUser(AuthSupport.userId(authentication), id);
	}

	@PostMapping("/{id}/pay")
	@Operation(summary = "Payer (stub si G2TPay désactivé)")
	public OrderResponse pay(Authentication authentication, @PathVariable Long id) {
		return orderService.pay(authentication, id);
	}

	@GetMapping("/payments/g2tpay/config")
	@Operation(summary = "Configuration paiement Mobile Money G2TPay")
	public G2tpayConfigResponse g2tpayConfig() {
		return new G2tpayConfigResponse(
				g2tpayProperties.isEnabled(),
				"XAF",
				"Paiement Mobile Money (MTN / Orange) via G2TPay.");
	}

	@PostMapping("/{id}/payments/g2tpay/redirect-url")
	@Operation(summary = "URL de redirection G2TPay (flux par pages /integrate/pay)")
	public G2tpayRedirectResponse g2tpayRedirectUrl(
			Authentication authentication,
			@PathVariable Long id,
			@RequestBody(required = false) @Valid G2tpayInitiateRequest request) {
		return g2tpayPaymentService.buildRedirectUrl(authentication, id, request);
	}

	@GetMapping("/payments/g2tpay/return")
	@Operation(summary = "Retour utilisateur après paiement G2TPay (public)")
	public ResponseEntity<Void> g2tpayReturn(
			@RequestParam Long orderId,
			@RequestParam(required = false) String status,
			@RequestParam(name = "message_id", required = false) String messageId,
			@RequestParam(name = "payment_id", required = false) String paymentId) {
		String target = g2tpayPaymentService.handleReturn(orderId, status, messageId, paymentId);
		return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(target)).build();
	}

	@GetMapping("/{id}/payments/status")
	@Operation(summary = "Statut paiement (état commande)")
	public PaymentStatusResponse paymentStatus(Authentication authentication, @PathVariable Long id) {
		return g2tpayPaymentService.paymentStatus(AuthSupport.userId(authentication), id);
	}

	@PostMapping("/{id}/cancel")
	@Operation(summary = "Annuler (en attente uniquement)")
	public OrderResponse cancel(Authentication authentication, @PathVariable Long id) {
		return orderService.cancel(AuthSupport.userId(authentication), id);
	}

	@GetMapping(value = "/{id}/invoice", produces = MediaType.TEXT_PLAIN_VALUE)
	@Operation(summary = "Facture texte (stub)")
	public String invoice(Authentication authentication, @PathVariable Long id) {
		return orderService.invoiceText(AuthSupport.userId(authentication), id);
	}

	@PostMapping("/webhook")
	@Operation(summary = "Webhook PSP (stub — accepte tout corps JSON)")
	public ResponseEntity<Void> webhook(@RequestBody(required = false) JsonNode body) {
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/webhook/g2tpay")
	@Operation(summary = "Webhook G2TPay (MTN / Orange Money)")
	public ResponseEntity<Void> g2tpayWebhook(@RequestBody(required = false) JsonNode body) {
		g2tpayPaymentService.handleWebhook(body);
		return ResponseEntity.ok().build();
	}
}
