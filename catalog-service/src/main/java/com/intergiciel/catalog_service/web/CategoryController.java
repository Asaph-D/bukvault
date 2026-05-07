package com.intergiciel.catalog_service.web;

import com.intergiciel.catalog_service.service.BookCatalogService;
import com.intergiciel.catalog_service.service.CategoryCatalogService;
import com.intergiciel.catalog_service.web.dto.BookListItemResponse;
import com.intergiciel.catalog_service.web.dto.CategoryResponse;
import com.intergiciel.catalog_service.web.dto.UpsertCategoryRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/categories")
@Validated
@Tag(name = "Categories")
public class CategoryController {

	private final CategoryCatalogService categoryCatalogService;
	private final BookCatalogService bookCatalogService;

	public CategoryController(CategoryCatalogService categoryCatalogService, BookCatalogService bookCatalogService) {
		this.categoryCatalogService = categoryCatalogService;
		this.bookCatalogService = bookCatalogService;
	}

	@GetMapping
	@Operation(summary = "Liste hiérarchisable (parentId + ordre)")
	public List<CategoryResponse> list() {
		return categoryCatalogService.listAll();
	}

	@GetMapping("/{id}/books")
	public Page<BookListItemResponse> booksByCategory(
			@PathVariable UUID id,
			@PageableDefault(size = 20) Pageable pageable) {
		return bookCatalogService.booksInCategory(id, pageable);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('ADMIN')")
	public CategoryResponse create(@Valid @RequestBody UpsertCategoryRequest request) {
		return categoryCatalogService.create(request);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody UpsertCategoryRequest request) {
		return categoryCatalogService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('ADMIN')")
	public void delete(@PathVariable UUID id) {
		categoryCatalogService.delete(id);
	}
}
