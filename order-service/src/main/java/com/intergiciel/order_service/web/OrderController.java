package com.intergiciel.order_service.web;

import com.intergiciel.order_service.service.OrderService;
import com.intergiciel.order_service.support.AuthSupport;
import com.intergiciel.order_service.web.dto.OrderResponse;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Commandes")
public class OrderController {

	private final OrderService orderService;

	public OrderController(OrderService orderService) {
		this.orderService = orderService;
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

	@GetMapping("/{id}")
	@Operation(summary = "Détail commande")
	public OrderResponse getOne(Authentication authentication, @PathVariable Long id) {
		return orderService.getForUser(AuthSupport.userId(authentication), id);
	}

	@PostMapping("/{id}/pay")
	@Operation(summary = "Payer (stub — passage en PAID)")
	public OrderResponse pay(Authentication authentication, @PathVariable Long id) {
		return orderService.pay(AuthSupport.userId(authentication), id);
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
}
