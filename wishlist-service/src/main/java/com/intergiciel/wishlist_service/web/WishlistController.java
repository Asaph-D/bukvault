package com.intergiciel.wishlist_service.web;

import com.intergiciel.wishlist_service.service.WishlistService;
import com.intergiciel.wishlist_service.support.AuthSupport;
import com.intergiciel.wishlist_service.web.dto.AddWishlistRequest;
import com.intergiciel.wishlist_service.web.dto.MoveToCartResponse;
import com.intergiciel.wishlist_service.web.dto.WishlistItemResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/wishlist")
@Tag(name = "Liste de souhaits")
public class WishlistController {

	private final WishlistService wishlistService;

	public WishlistController(WishlistService wishlistService) {
		this.wishlistService = wishlistService;
	}

	@GetMapping
	@Operation(summary = "Ma liste")
	public List<WishlistItemResponse> list(Authentication authentication) {
		return wishlistService.list(AuthSupport.userId(authentication));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Ajouter un livre")
	public WishlistItemResponse add(Authentication authentication, @Valid @RequestBody AddWishlistRequest request) {
		return wishlistService.add(AuthSupport.userId(authentication), request);
	}

	@DeleteMapping("/{bookId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Retirer un livre")
	public void remove(Authentication authentication, @PathVariable UUID bookId) {
		wishlistService.remove(AuthSupport.userId(authentication), bookId);
	}

	@PostMapping("/move-to-cart")
	@Operation(summary = "Transfert vers le panier (réutilise le JWT vers order-service)")
	public MoveToCartResponse moveToCart(Authentication authentication, HttpServletRequest request) {
		String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (auth == null || auth.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "En-tête Authorization requis pour le panier.");
		}
		return wishlistService.moveAllToCart(AuthSupport.userId(authentication), auth);
	}
}
