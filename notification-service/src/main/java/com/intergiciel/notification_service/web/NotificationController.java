package com.intergiciel.notification_service.web;

import com.intergiciel.notification_service.service.NotificationService;
import com.intergiciel.notification_service.support.AuthSupport;
import com.intergiciel.notification_service.web.dto.NotificationResponse;
import com.intergiciel.notification_service.web.dto.PreferencesResponse;
import com.intergiciel.notification_service.web.dto.PreferencesUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@Tag(name = "Notifications")
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	@GetMapping
	@Operation(summary = "Mes notifications")
	public Page<NotificationResponse> list(Authentication authentication,
			@PageableDefault(size = 20) Pageable pageable) {
		return notificationService.list(AuthSupport.userId(authentication), pageable);
	}

	@GetMapping("/unread-count")
	@Operation(summary = "Nombre de notifications non lues")
	public UnreadCountResponse unreadCount(Authentication authentication) {
		long n = notificationService.countUnread(AuthSupport.userId(authentication));
		return new UnreadCountResponse(n);
	}

	@PatchMapping("/{id}/read")
	@Operation(summary = "Marquer comme lue")
	public NotificationResponse markRead(Authentication authentication, @PathVariable Long id) {
		return notificationService.markRead(AuthSupport.userId(authentication), id);
	}

	@PostMapping("/read-all")
	@Operation(summary = "Tout marquer comme lu")
	public MarkAllReadResult markAllRead(Authentication authentication) {
		int n = notificationService.markAllRead(AuthSupport.userId(authentication));
		return new MarkAllReadResult(n);
	}

	@GetMapping("/preferences")
	@Operation(summary = "Préférences de notification")
	public PreferencesResponse getPrefs(Authentication authentication) {
		return notificationService.getPreferences(AuthSupport.userId(authentication));
	}

	@PutMapping("/preferences")
	@Operation(summary = "Mettre à jour les préférences")
	public PreferencesResponse putPrefs(Authentication authentication,
			@Valid @RequestBody PreferencesUpdateRequest request) {
		return notificationService.updatePreferences(AuthSupport.userId(authentication), request);
	}

	public record MarkAllReadResult(int updatedCount) {
	}

	public record UnreadCountResponse(long count) {
	}
}
