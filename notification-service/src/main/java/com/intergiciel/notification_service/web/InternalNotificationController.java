package com.intergiciel.notification_service.web;

import com.intergiciel.notification_service.service.NotificationDispatchService;
import com.intergiciel.notification_service.web.dto.BookPendingValidationRequest;
import com.intergiciel.notification_service.web.dto.BookPublishedNotificationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/notifications/internal")
@Tag(name = "Notifications (interne)")
public class InternalNotificationController {

	private final NotificationDispatchService dispatchService;
	private final String serviceKey;

	public InternalNotificationController(
			NotificationDispatchService dispatchService,
			@Value("${bookvault.internal.service-key}") String serviceKey) {
		this.dispatchService = dispatchService;
		this.serviceKey = serviceKey;
	}

	@PostMapping("/book-pending-validation")
	@ResponseStatus(HttpStatus.ACCEPTED)
	@Operation(summary = "Notification admin — nouveau manuscrit en file de validation")
	public void bookPendingValidation(
			@RequestHeader(name = "X-BookVault-Internal-Key") String internalKey,
			@Valid @RequestBody BookPendingValidationRequest request) {
		assertInternalKey(internalKey);
		dispatchService.notifyBookPendingValidation(request);
	}

	@PostMapping("/book-published")
	@ResponseStatus(HttpStatus.ACCEPTED)
	@Operation(summary = "Notification auteur — livre validé par l'admin")
	public void bookPublished(
			@RequestHeader(name = "X-BookVault-Internal-Key") String internalKey,
			@Valid @RequestBody BookPublishedNotificationRequest request) {
		assertInternalKey(internalKey);
		dispatchService.notifyBookPublishedByAdmin(request);
	}

	private void assertInternalKey(String provided) {
		if (serviceKey == null || serviceKey.isBlank() || !serviceKey.equals(provided)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Clé de service invalide.");
		}
	}
}
