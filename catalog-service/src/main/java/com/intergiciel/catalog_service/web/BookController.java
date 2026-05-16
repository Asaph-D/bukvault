package com.intergiciel.catalog_service.web;

import com.intergiciel.catalog_service.domain.BookFormat;
import com.intergiciel.catalog_service.service.BookCatalogService;
import com.intergiciel.catalog_service.service.CatalogAccess;
import com.intergiciel.catalog_service.web.dto.BookDetailResponse;
import com.intergiciel.catalog_service.web.dto.BookListItemResponse;
import com.intergiciel.catalog_service.web.dto.CreateBookRequest;
import com.intergiciel.catalog_service.web.dto.PreviewResponse;
import com.intergiciel.catalog_service.web.dto.PublishBookRequest;
import com.intergiciel.catalog_service.web.dto.UpdateBookRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/books")
@Validated
@Tag(name = "Books")
public class BookController {

	private final BookCatalogService bookCatalogService;

	public BookController(BookCatalogService bookCatalogService) {
		this.bookCatalogService = bookCatalogService;
	}

	@GetMapping("/search")
	@Operation(summary = "Recherche texte titre / ISBN")
	public Page<BookListItemResponse> search(
			@RequestParam String q,
			@PageableDefault(size = 20) Pageable pageable) {
		return bookCatalogService.search(q, pageable);
	}

	@GetMapping("/bestsellers")
	@Operation(summary = "Tri par popularité (vues) — filtres via tri client")
	public Page<BookListItemResponse> bestsellers(
			@PageableDefault(size = 20, sort = "viewCount", direction = Sort.Direction.DESC) Pageable pageable) {
		return bookCatalogService.bestsellers(pageable);
	}

	@GetMapping("/recommended")
	@Operation(summary = "Recommandations (stub = bestsellers tant que l’historique d’achat n’est pas branché)")
	public Page<BookListItemResponse> recommended(
			Authentication authentication,
			@PageableDefault(size = 20) Pageable pageable) {
		return bookCatalogService.recommended(jwtFrom(authentication), pageable);
	}

	@GetMapping("/{id}/preview")
	@Operation(summary = "Extrait — URL signée via file-service à terme")
	public PreviewResponse preview(@PathVariable UUID id, Authentication authentication) {
		return bookCatalogService.preview(id, jwtFrom(authentication));
	}

	@GetMapping("/mine")
	@Operation(summary = "Mes livres (auteur connecté — tous statuts, hors supprimés)")
	@PreAuthorize("hasRole('AUTHOR')")
	public Page<BookListItemResponse> myBooks(
			Authentication authentication,
			@PageableDefault(size = 48, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {
		Jwt jwt = jwtFrom(authentication);
		return bookCatalogService.listForAuthor(CatalogAccess.userId(jwt), pageable);
	}

	@GetMapping("/{id}")
	public BookDetailResponse getOne(@PathVariable UUID id, Authentication authentication) {
		return bookCatalogService.getById(id, jwtFrom(authentication));
	}

	@GetMapping
	@Operation(summary = "Catalogue public (publiés uniquement)")
	public Page<BookListItemResponse> list(
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) UUID authorId,
			@RequestParam(required = false) BigDecimal minPrice,
			@RequestParam(required = false) BigDecimal maxPrice,
			@RequestParam(required = false) BookFormat format,
			@RequestParam(required = false) String language,
			@RequestParam(required = false) Double minRating,
			@PageableDefault(size = 20) Pageable pageable) {
		return bookCatalogService.listCatalog(categoryId, authorId, minPrice, maxPrice, format, language, minRating,
				pageable);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyRole('AUTHOR','ADMIN')")
	public BookDetailResponse create(@Valid @RequestBody CreateBookRequest request, Authentication authentication) {
		return bookCatalogService.create(request, (Jwt) authentication.getPrincipal());
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasAnyRole('AUTHOR','ADMIN')")
	public BookDetailResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateBookRequest request,
			Authentication authentication) {
		return bookCatalogService.update(id, request, (Jwt) authentication.getPrincipal());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAnyRole('AUTHOR','ADMIN')")
	public void delete(@PathVariable UUID id, Authentication authentication) {
		bookCatalogService.softDelete(id, (Jwt) authentication.getPrincipal());
	}

	@PatchMapping("/{id}/publish")
	@PreAuthorize("hasAnyRole('AUTHOR','ADMIN')")
	public BookDetailResponse publish(
			@PathVariable UUID id,
			@Valid @RequestBody PublishBookRequest request,
			Authentication authentication) {
		return bookCatalogService.publish(id, request, (Jwt) authentication.getPrincipal());
	}

	@PostMapping("/{id}/submit-for-review")
	@PreAuthorize("hasRole('AUTHOR')")
	public BookDetailResponse submitForReview(@PathVariable UUID id, Authentication authentication) {
		return bookCatalogService.submitForReview(id, (Jwt) authentication.getPrincipal());
	}

	private static Jwt jwtFrom(Authentication authentication) {
		if (authentication instanceof JwtAuthenticationToken jwtAuth) {
			return jwtAuth.getToken();
		}
		return null;
	}
}
