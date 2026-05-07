package com.intergiciel.author_service.web;

import tools.jackson.databind.JsonNode;
import com.intergiciel.author_service.service.AuthorService;
import com.intergiciel.author_service.support.AuthSupport;
import com.intergiciel.author_service.web.dto.AuthorDashboardResponse;
import com.intergiciel.author_service.web.dto.AuthorProfileUpdateRequest;
import com.intergiciel.author_service.web.dto.AuthorPublicProfileResponse;
import com.intergiciel.author_service.web.dto.AuthorStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/authors")
@Tag(name = "Auteurs")
public class AuthorController {

	private final AuthorService authorService;

	public AuthorController(AuthorService authorService) {
		this.authorService = authorService;
	}

	@GetMapping
	@Operation(summary = "Annuaire (vide — enrichissement futur)")
	public Page<AuthorPublicProfileResponse> list(@PageableDefault(size = 20) Pageable pageable) {
		return authorService.listAuthors(pageable);
	}

	@GetMapping("/me/dashboard")
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Tableau de bord auteur")
	public AuthorDashboardResponse dashboard(Authentication authentication) {
		return authorService.dashboard(AuthSupport.userId(authentication));
	}

	@GetMapping("/me/stats")
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Statistiques (stub)")
	public AuthorStatsResponse stats(Authentication authentication) {
		return authorService.stats(AuthSupport.userId(authentication));
	}

	@PutMapping("/me/profile")
	@PreAuthorize("hasRole('AUTHOR')")
	@Operation(summary = "Profil public auteur")
	public AuthorPublicProfileResponse updateProfile(
			Authentication authentication,
			@Valid @RequestBody AuthorProfileUpdateRequest request) {
		return authorService.updateMyProfile(AuthSupport.userId(authentication), request);
	}

	@GetMapping("/{authorId}/books")
	@Operation(summary = "Livres du catalogue pour cet auteur (proxy catalog-service)")
	public JsonNode booksByAuthor(
			@PathVariable UUID authorId,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return authorService.getBooksForAuthor(authorId, page, size);
	}

	@GetMapping("/{authorId}")
	@Operation(summary = "Fiche auteur publique")
	public AuthorPublicProfileResponse getOne(@PathVariable UUID authorId) {
		return authorService.getPublicProfile(authorId);
	}
}
