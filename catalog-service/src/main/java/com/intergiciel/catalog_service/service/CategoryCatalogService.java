package com.intergiciel.catalog_service.service;

import com.intergiciel.catalog_service.domain.Category;
import com.intergiciel.catalog_service.repository.CategoryRepository;
import com.intergiciel.catalog_service.util.SlugUtil;
import com.intergiciel.catalog_service.web.dto.CategoryResponse;
import com.intergiciel.catalog_service.web.dto.UpsertCategoryRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CategoryCatalogService {

	private final CategoryRepository categoryRepository;

	public CategoryCatalogService(CategoryRepository categoryRepository) {
		this.categoryRepository = categoryRepository;
	}

	@Transactional(readOnly = true)
	public List<CategoryResponse> listAll() {
		return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CategoryResponse create(UpsertCategoryRequest request) {
		Category parent = null;
		if (request.parentId() != null) {
			parent = categoryRepository.findById(request.parentId())
					.orElseThrow(() -> new NotFoundException("Catégorie parente introuvable."));
		}
		String base = SlugUtil.slugify(request.name());
		String slug = uniqueSlug(base, null);
		Category c = Category.builder()
				.name(request.name().trim())
				.slug(slug)
				.description(request.description())
				.parent(parent)
				.displayOrder(request.displayOrder())
				.iconUrl(request.iconUrl())
				.bookCountCache(0)
				.build();
		return toResponse(categoryRepository.save(c));
	}

	@Transactional
	public CategoryResponse update(UUID id, UpsertCategoryRequest request) {
		Category c = categoryRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Catégorie introuvable."));
		Category parent = null;
		if (request.parentId() != null) {
			if (request.parentId().equals(id)) {
				throw new IllegalArgumentException("Une catégorie ne peut pas être son propre parent.");
			}
			parent = categoryRepository.findById(request.parentId())
					.orElseThrow(() -> new NotFoundException("Catégorie parente introuvable."));
		}
		c.setName(request.name().trim());
		String base = SlugUtil.slugify(request.name());
		String slug = uniqueSlug(base, id);
		c.setSlug(slug);
		c.setDescription(request.description());
		c.setParent(parent);
		c.setDisplayOrder(request.displayOrder());
		c.setIconUrl(request.iconUrl());
		return toResponse(categoryRepository.save(c));
	}

	@Transactional
	public void delete(UUID id) {
		Category c = categoryRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("Catégorie introuvable."));
		long linked = categoryRepository.countBooksLinked(id);
		if (linked > 0) {
			throw new IllegalStateException("Impossible de supprimer : des livres sont encore associés.");
		}
		if (!categoryRepository.findByParent_IdOrderByDisplayOrderAsc(id).isEmpty()) {
			throw new IllegalStateException("Impossible de supprimer : des sous-catégories existent.");
		}
		categoryRepository.delete(c);
	}

	private String uniqueSlug(String base, UUID excludeCategoryId) {
		String s = base;
		int i = 1;
		while (true) {
			boolean exists = excludeCategoryId == null
					? categoryRepository.existsBySlug(s)
					: categoryRepository.existsBySlugAndIdNot(s, excludeCategoryId);
			if (!exists) {
				return s;
			}
			s = base + "-" + i++;
		}
	}

	private CategoryResponse toResponse(Category c) {
		return new CategoryResponse(
				c.getId(),
				c.getName(),
				c.getSlug(),
				c.getDescription(),
				c.getParent() != null ? c.getParent().getId() : null,
				c.getDisplayOrder(),
				c.getIconUrl(),
				c.getBookCountCache());
	}
}
