package com.intergiciel.notification_service.web;

import com.intergiciel.notification_service.service.BookSubscriptionService;
import com.intergiciel.notification_service.support.AuthSupport;
import com.intergiciel.notification_service.web.dto.BookSubscriptionRequest;
import com.intergiciel.notification_service.web.dto.SubscriptionStatusResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications/subscriptions/books")
@Tag(name = "Abonnements (livres)")
public class BookSubscriptionController {

	private final BookSubscriptionService service;

	public BookSubscriptionController(BookSubscriptionService service) {
		this.service = service;
	}

	@PostMapping
	@Operation(summary = "S'abonner à un livre (notifications liées)")
	public void subscribe(Authentication authentication, @Valid @RequestBody BookSubscriptionRequest req) {
		service.subscribe(AuthSupport.userId(authentication), req.bookId());
	}

	@DeleteMapping("/{bookId}")
	@Operation(summary = "Se désabonner d’un livre")
	public void unsubscribe(Authentication authentication, @PathVariable UUID bookId) {
		service.unsubscribe(AuthSupport.userId(authentication), bookId);
	}

	@GetMapping("/{bookId}")
	@Operation(summary = "Statut abonnement à un livre")
	public SubscriptionStatusResponse status(Authentication authentication, @PathVariable UUID bookId) {
		return new SubscriptionStatusResponse(service.isSubscribed(AuthSupport.userId(authentication), bookId));
	}
}

