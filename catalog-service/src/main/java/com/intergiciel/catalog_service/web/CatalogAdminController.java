package com.intergiciel.catalog_service.web;

import com.intergiciel.catalog_service.domain.BookStatus;
import com.intergiciel.catalog_service.service.BookCatalogService;
import com.intergiciel.catalog_service.web.dto.BookListItemResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/catalog/admin")
@Tag(name = "Catalog admin", description = "Catalogue complet (ADMIN)")
@PreAuthorize("hasRole('ADMIN')")
public class CatalogAdminController {

	private final BookCatalogService bookCatalogService;

	public CatalogAdminController(BookCatalogService bookCatalogService) {
		this.bookCatalogService = bookCatalogService;
	}

	@GetMapping("/books")
	@Operation(summary = "Liste paginée — tous statuts, filtre auteur")
	public Page<BookListItemResponse> listBooks(
			@RequestParam(required = false) BookStatus status,
			@RequestParam(required = false) UUID authorId,
			@RequestParam(required = false) String q,
			@PageableDefault(size = 20, sort = "updatedAt,desc") Pageable pageable) {
		return bookCatalogService.listAdmin(status, authorId, q, pageable);
	}
}
