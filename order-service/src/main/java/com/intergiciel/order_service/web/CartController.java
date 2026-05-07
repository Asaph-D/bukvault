package com.intergiciel.order_service.web;

import com.intergiciel.order_service.service.CartService;
import com.intergiciel.order_service.support.AuthSupport;
import com.intergiciel.order_service.web.dto.AddToCartRequest;
import com.intergiciel.order_service.web.dto.CartLineResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Panier")
public class CartController {

	private final CartService cartService;

	public CartController(CartService cartService) {
		this.cartService = cartService;
	}

	@GetMapping
	@Operation(summary = "Contenu du panier")
	public List<CartLineResponse> getCart(Authentication authentication) {
		return cartService.list(AuthSupport.userId(authentication));
	}

	@PostMapping("/add")
	@Operation(summary = "Ajouter une ligne (prix repris du catalogue)")
	public CartLineResponse add(Authentication authentication, @Valid @RequestBody AddToCartRequest request) {
		return cartService.add(AuthSupport.userId(authentication), request);
	}

	@DeleteMapping("/{itemId}")
	@Operation(summary = "Retirer une ligne")
	public void remove(Authentication authentication, @PathVariable Long itemId) {
		cartService.removeLine(AuthSupport.userId(authentication), itemId);
	}
}
