package com.intergiciel.admin_service.web;

import com.intergiciel.admin_service.service.AdminFacadeService;
import com.intergiciel.admin_service.web.dto.AdminDashboardResponse;
import com.intergiciel.admin_service.web.dto.PendingBooksResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Administration")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

	private final AdminFacadeService adminFacadeService;

	public AdminController(AdminFacadeService adminFacadeService) {
		this.adminFacadeService = adminFacadeService;
	}

	@GetMapping("/dashboard")
	@Operation(summary = "Vue synthétique plateforme (agrégation microservices)")
	public AdminDashboardResponse dashboard(HttpServletRequest request) {
		String auth = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
		return adminFacadeService.dashboard(auth);
	}

	@GetMapping("/books/pending")
	@Operation(summary = "Livres en attente de validation (stub)")
	public PendingBooksResponse pendingBooks() {
		return adminFacadeService.pendingBooks();
	}

	@PostMapping("/books/{bookId}/publish")
	@Operation(summary = "Publier via catalog-service (proxy PATCH)")
	public ResponseEntity<String> publish(
			@PathVariable UUID bookId,
			@RequestParam(defaultValue = "true") boolean publish,
			HttpServletRequest request) {
		String auth = request.getHeader(org.springframework.http.HttpHeaders.AUTHORIZATION);
		if (auth == null || auth.isBlank()) {
			return ResponseEntity.status(401).body("{\"error\":\"Authorization requis\"}");
		}
		return adminFacadeService.publishBook(bookId, auth, publish);
	}
}
