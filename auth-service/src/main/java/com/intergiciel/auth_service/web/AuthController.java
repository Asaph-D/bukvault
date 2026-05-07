package com.intergiciel.auth_service.web;

import com.intergiciel.auth_service.security.AuthUserPrincipal;
import com.intergiciel.auth_service.service.AuthService;
import com.intergiciel.auth_service.web.dto.AuthResponse;
import com.intergiciel.auth_service.web.dto.ChangePasswordRequest;
import com.intergiciel.auth_service.web.dto.LoginRequest;
import com.intergiciel.auth_service.web.dto.LogoutRequest;
import com.intergiciel.auth_service.web.dto.RefreshRequest;
import com.intergiciel.auth_service.web.dto.RevokeAllSessionsResponse;
import com.intergiciel.auth_service.web.dto.RegisterRequest;
import com.intergiciel.auth_service.web.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Validated
@Tag(name = "Authentication")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "Inscription (rôle USER ou AUTHOR selon objectif ; ADMIN interdit)")
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	@Operation(summary = "Connexion e-mail / mot de passe")
	public AuthResponse login(@Valid @RequestBody LoginRequest request) {
		return authService.login(request);
	}

	@PostMapping("/refresh")
	@Operation(summary = "Nouvelle paire de tokens à partir du refresh token")
	public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request.refreshToken());
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Révoque les tokens (blacklist access JTI + refresh)")
	public void logout(
			@AuthenticationPrincipal AuthUserPrincipal principal,
			HttpServletRequest httpRequest,
			@RequestBody(required = false) LogoutRequest body) {
		String bearer = httpRequest.getHeader(HttpHeaders.AUTHORIZATION);
		String access = null;
		if (bearer != null && bearer.startsWith("Bearer ")) {
			access = bearer.substring(7).trim();
		}
		String refreshOpt = body != null ? body.refreshToken() : null;
		authService.logout(principal.getUserId(), access, refreshOpt);
	}

	@PostMapping("/logout-all")
	@Operation(summary = "Déconnecte toutes les sessions (révoque tous les refresh tokens)")
	public RevokeAllSessionsResponse logoutAll(
			@AuthenticationPrincipal AuthUserPrincipal principal,
			HttpServletRequest httpRequest) {
		String bearer = httpRequest.getHeader(HttpHeaders.AUTHORIZATION);
		String access = null;
		if (bearer != null && bearer.startsWith("Bearer ")) {
			access = bearer.substring(7).trim();
		}
		int revoked = authService.revokeAllSessions(principal.getUserId(), access);
		return new RevokeAllSessionsResponse(revoked);
	}

	@PostMapping("/change-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Operation(summary = "Change le mot de passe (révoque toutes les sessions)")
	public void changePassword(
			@AuthenticationPrincipal AuthUserPrincipal principal,
			HttpServletRequest httpRequest,
			@Valid @RequestBody ChangePasswordRequest body) {
		String bearer = httpRequest.getHeader(HttpHeaders.AUTHORIZATION);
		String access = null;
		if (bearer != null && bearer.startsWith("Bearer ")) {
			access = bearer.substring(7).trim();
		}
		authService.changePassword(principal.getUserId(), access, body);
	}

	@GetMapping("/me")
	@Operation(summary = "Profil de l'utilisateur authentifié")
	public UserResponse me(@AuthenticationPrincipal AuthUserPrincipal principal) {
		return authService.getMe(principal.getUserId());
	}

	@PostMapping("/forgot-password")
	@Operation(summary = "Non implémenté dans cette version")
	public ResponseEntity<Void> forgotPassword() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}

	@PostMapping("/reset-password")
	@Operation(summary = "Non implémenté dans cette version")
	public ResponseEntity<Void> resetPassword() {
		return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
	}
}
