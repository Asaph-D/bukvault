package com.intergiciel.user_service.web;

import com.intergiciel.user_service.domain.Role;
import com.intergiciel.user_service.service.UserProfileService;
import com.intergiciel.user_service.service.ReaderSettingsService;
import com.intergiciel.user_service.web.dto.LibraryItemResponse;
import com.intergiciel.user_service.web.dto.OrderSummaryResponse;
import com.intergiciel.user_service.web.dto.ReaderSettingsResponse;
import com.intergiciel.user_service.web.dto.UpdateReaderSettingsRequest;
import com.intergiciel.user_service.web.dto.UpdateRoleRequest;
import com.intergiciel.user_service.web.dto.UpdateUserActiveRequest;
import com.intergiciel.user_service.web.dto.UpdateUserRequest;
import com.intergiciel.user_service.web.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@Validated
@Tag(name = "Users", description = "Profils utilisateurs")
public class UserController {

	private final UserProfileService userProfileService;
	private final ReaderSettingsService readerSettingsService;

	public UserController(UserProfileService userProfileService, ReaderSettingsService readerSettingsService) {
		this.userProfileService = userProfileService;
		this.readerSettingsService = readerSettingsService;
	}

	@PostMapping("/bootstrap")
	@Operation(summary = "Crée le profil à partir du JWT (après inscription auth) si absent")
	public UserResponse bootstrap(@AuthenticationPrincipal Jwt jwt) {
		return userProfileService.bootstrap(jwt);
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Liste paginée — ADMIN uniquement")
	public Page<UserResponse> list(
			@RequestParam(required = false) Role role,
			@RequestParam(required = false) Boolean active,
			@PageableDefault(size = 20) Pageable pageable) {
		return userProfileService.listAll(role, active, pageable);
	}

	@GetMapping("/{id}")
	public UserResponse get(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		return userProfileService.getById(id, jwt);
	}

	@PutMapping("/{id}")
	public UserResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateUserRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		return userProfileService.update(id, request, jwt);
	}

	@GetMapping("/{id}/reader-settings")
	@Operation(summary = "Préférences lecteur (thème, notifications, communauté, etc.)")
	public ReaderSettingsResponse getReaderSettings(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		return readerSettingsService.get(id, jwt);
	}

	@PutMapping("/{id}/reader-settings")
	@Operation(summary = "Met à jour les préférences lecteur")
	public ReaderSettingsResponse updateReaderSettings(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateReaderSettingsRequest request,
			@AuthenticationPrincipal Jwt jwt) {
		return readerSettingsService.upsert(id, request, jwt);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Désactivation logique du compte (RGPD)")
	public void delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
		userProfileService.deactivate(id, jwt);
	}

	@GetMapping("/{id}/orders")
	@Operation(summary = "Placeholder — données réelles via order-service")
	public Page<OrderSummaryResponse> orders(
			@PathVariable UUID id,
			@AuthenticationPrincipal Jwt jwt,
			@PageableDefault(size = 20) Pageable pageable) {
		return userProfileService.listOrdersPlaceholder(id, jwt, pageable);
	}

	@GetMapping("/{id}/library")
	@Operation(summary = "Placeholder bibliothèque numérique")
	public Page<LibraryItemResponse> library(
			@PathVariable UUID id,
			@AuthenticationPrincipal Jwt jwt,
			@PageableDefault(size = 20) Pageable pageable) {
		return userProfileService.libraryPlaceholder(id, jwt, pageable);
	}

	@PutMapping("/{id}/role")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Change le rôle métier (profil) — à synchroniser avec auth-service en production")
	public UserResponse updateRole(@PathVariable UUID id, @Valid @RequestBody UpdateRoleRequest request) {
		return userProfileService.updateRole(id, request);
	}

	@PutMapping("/{id}/active")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Active ou suspend un compte (monitoring admin)")
	public UserResponse setActive(@PathVariable UUID id, @Valid @RequestBody UpdateUserActiveRequest request) {
		return userProfileService.setActive(id, request.active());
	}
}
