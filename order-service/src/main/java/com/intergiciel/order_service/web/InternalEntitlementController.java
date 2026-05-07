package com.intergiciel.order_service.web;

import com.intergiciel.order_service.service.PurchaseEntitlementService;
import com.intergiciel.order_service.web.dto.EntitlementResponse;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internal/entitlements")
@Hidden
public class InternalEntitlementController {

	private final PurchaseEntitlementService purchaseEntitlementService;

	public InternalEntitlementController(PurchaseEntitlementService purchaseEntitlementService) {
		this.purchaseEntitlementService = purchaseEntitlementService;
	}

	@GetMapping("/users/{userId}/books/{bookId}")
	public EntitlementResponse check(
			@PathVariable UUID userId,
			@PathVariable UUID bookId) {
		boolean allowed = purchaseEntitlementService.hasPurchasedBook(userId, bookId);
		return new EntitlementResponse(allowed);
	}
}
