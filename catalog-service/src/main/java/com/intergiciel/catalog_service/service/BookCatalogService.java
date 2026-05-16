package com.intergiciel.catalog_service.service;

import com.intergiciel.catalog_service.domain.Book;
import com.intergiciel.catalog_service.integration.BookPublicationNotifier;
import com.intergiciel.catalog_service.domain.BookFormat;
import com.intergiciel.catalog_service.domain.BookStatus;
import com.intergiciel.catalog_service.domain.Category;
import com.intergiciel.catalog_service.repository.BookRepository;
import com.intergiciel.catalog_service.repository.CategoryRepository;
import com.intergiciel.catalog_service.repository.spec.BookSpecs;
import com.intergiciel.catalog_service.web.dto.BookDetailResponse;
import com.intergiciel.catalog_service.web.dto.BookListItemResponse;
import com.intergiciel.catalog_service.web.dto.CategorySummaryResponse;
import com.intergiciel.catalog_service.web.dto.CreateBookRequest;
import com.intergiciel.catalog_service.web.dto.PreviewResponse;
import com.intergiciel.catalog_service.web.dto.PublishBookRequest;
import com.intergiciel.catalog_service.web.dto.UpdateBookRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BookCatalogService {

	private final BookRepository bookRepository;
	private final CategoryRepository categoryRepository;
	private final BookPublicationNotifier publicationNotifier;

	public BookCatalogService(
			BookRepository bookRepository,
			CategoryRepository categoryRepository,
			BookPublicationNotifier publicationNotifier) {
		this.bookRepository = bookRepository;
		this.categoryRepository = categoryRepository;
		this.publicationNotifier = publicationNotifier;
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> listCatalog(
			UUID categoryId,
			UUID authorId,
			BigDecimal minPrice,
			BigDecimal maxPrice,
			BookFormat format,
			String language,
			Double minRating,
			Pageable pageable) {
		Specification<Book> spec = Specification.where(BookSpecs.catalogPublic())
				.and(BookSpecs.inCategory(categoryId))
				.and(BookSpecs.authorIs(authorId))
				.and(BookSpecs.formatIs(format))
				.and(BookSpecs.languageIs(language))
				.and(BookSpecs.priceBetween(minPrice, maxPrice))
				.and(BookSpecs.minRating(minRating));
		return bookRepository.findAll(spec, pageable).map(this::toListItem);
	}

	/** Liste des livres non supprimés d’un auteur (tous statuts) — tableau de bord auteur. */
	@Transactional(readOnly = true)
	public Page<BookListItemResponse> listForAuthor(UUID authorId, Pageable pageable) {
		Specification<Book> spec = Specification.where(BookSpecs.notDeleted()).and(BookSpecs.authorIs(authorId));
		return bookRepository.findAll(spec, pageable).map(this::toListItem);
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> listAdmin(BookStatus status, UUID authorId, String q, Pageable pageable) {
		Specification<Book> spec = Specification.where(BookSpecs.notDeleted())
				.and(BookSpecs.statusIs(status))
				.and(BookSpecs.authorIs(authorId))
				.and(BookSpecs.titleOrIsbnContains(q));
		return bookRepository.findAll(spec, pageable).map(this::toListItem);
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> search(String q, Pageable pageable) {
		Specification<Book> spec = BookSpecs.catalogPublic().and(BookSpecs.titleOrIsbnContains(q));
		return bookRepository.findAll(spec, pageable).map(this::toListItem);
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> bestsellers(Pageable pageable) {
		return bookRepository.findAll(BookSpecs.catalogPublic(), pageable).map(this::toListItem);
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> recommended(Jwt jwt, Pageable pageable) {
		// Stub : même tri que bestsellers ; personnalisation = historique commandes (futur)
		return bestsellers(pageable);
	}

	@Transactional
	public BookDetailResponse getById(UUID id, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!canRead(b, jwt)) {
			throw new NotFoundException("Livre introuvable.");
		}
		bookRepository.incrementViewCount(id);
		Book refreshed = bookRepository.findById(id).orElseThrow();
		return toDetail(refreshed);
	}

	@Transactional
	public BookDetailResponse create(CreateBookRequest request, Jwt jwt) {
		if (!CatalogAccess.canCreateBook(jwt)) {
			throw new ForbiddenException("Seuls les auteurs et administrateurs peuvent créer un livre.");
		}
		UUID authorId = resolveAuthorId(jwt, request.authorUserId());
		if (bookRepository.existsByIsbn(request.isbn().trim())) {
			throw new IllegalArgumentException("ISBN déjà utilisé.");
		}
		Set<Category> cats = loadCategories(request.categoryIds());
		Instant now = Instant.now();
		Book book = Book.builder()
				.isbn(request.isbn().trim())
				.title(request.title().trim())
				.description(request.description())
				.price(request.price())
				.language(request.language().trim())
				.format(request.format())
				.status(BookStatus.DRAFT)
				.authorUserId(authorId)
				.coverUrl(request.coverUrl())
				.viewCount(0)
				.averageRating(0)
				.reviewCount(0)
				.deleted(false)
				.publishedAt(null)
				.createdAt(now)
				.updatedAt(now)
				.categories(new HashSet<>(cats))
				.build();
		return toDetail(bookRepository.save(book));
	}

	@Transactional
	public BookDetailResponse update(UUID id, UpdateBookRequest request, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!CatalogAccess.canEditBook(b, jwt)) {
			throw new ForbiddenException("Modification non autorisée.");
		}
		if (!b.getIsbn().equalsIgnoreCase(request.isbn().trim())
				&& bookRepository.existsByIsbnAndIdNot(request.isbn().trim(), id)) {
			throw new IllegalArgumentException("ISBN déjà utilisé.");
		}
		b.setIsbn(request.isbn().trim());
		b.setTitle(request.title().trim());
		b.setDescription(request.description());
		b.setPrice(request.price());
		b.setLanguage(request.language().trim());
		b.setFormat(request.format());
		b.setCoverUrl(request.coverUrl());
		b.setCategories(new HashSet<>(loadCategories(request.categoryIds())));
		b.setUpdatedAt(Instant.now());
		return toDetail(bookRepository.save(b));
	}

	@Transactional
	public void softDelete(UUID id, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!CatalogAccess.canEditBook(b, jwt)) {
			throw new ForbiddenException("Suppression non autorisée.");
		}
		b.setDeleted(true);
		b.setUpdatedAt(Instant.now());
		bookRepository.save(b);
	}

	@Transactional
	public BookDetailResponse submitForReview(UUID id, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!CatalogAccess.canEditBook(b, jwt)) {
			throw new ForbiddenException("Dépôt non autorisé.");
		}
		if (b.getStatus() == BookStatus.PUBLISHED) {
			throw new IllegalArgumentException("Ce livre est déjà publié.");
		}
		if (b.getTitle() == null || b.getTitle().isBlank() || b.getCategories().isEmpty()) {
			throw new IllegalArgumentException("Titre et au moins une catégorie sont requis avant dépôt.");
		}
		b.setStatus(BookStatus.DRAFT);
		b.setPublishedAt(null);
		b.setUpdatedAt(Instant.now());
		Book saved = bookRepository.save(b);
		publicationNotifier.notifyAdminPendingValidation(saved, jwt);
		return toDetail(saved);
	}

	@Transactional
	public BookDetailResponse publish(UUID id, PublishBookRequest request, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!CatalogAccess.canEditBook(b, jwt)) {
			throw new ForbiddenException("Publication non autorisée.");
		}
		if (Boolean.TRUE.equals(request.publish())) {
			if (b.getTitle() == null || b.getTitle().isBlank()
					|| b.getCategories().isEmpty()) {
				throw new IllegalArgumentException("Titre et au moins une catégorie sont requis pour publier.");
			}
			b.setStatus(BookStatus.PUBLISHED);
			b.setPublishedAt(Instant.now());
		}
		else {
			b.setStatus(BookStatus.DRAFT);
			b.setPublishedAt(null);
		}
		b.setUpdatedAt(Instant.now());
		Book saved = bookRepository.save(b);
		if (Boolean.TRUE.equals(request.publish()) && CatalogAccess.isAdmin(jwt)) {
			publicationNotifier.notifyAuthorAfterAdminPublish(saved, jwt);
		}
		return toDetail(saved);
	}

	@Transactional(readOnly = true)
	public PreviewResponse preview(UUID id, Jwt jwt) {
		Book b = bookRepository.findById(id).orElseThrow(() -> new NotFoundException("Livre introuvable."));
		if (!canRead(b, jwt)) {
			throw new NotFoundException("Livre introuvable.");
		}
		return new PreviewResponse(
				null,
				Instant.now().plus(30, ChronoUnit.MINUTES),
				"URL signée à fournir par file-service ; stub catalogue.");
	}

	@Transactional(readOnly = true)
	public Page<BookListItemResponse> booksInCategory(UUID categoryId, Pageable pageable) {
		if (!categoryRepository.existsById(categoryId)) {
			throw new NotFoundException("Catégorie introuvable.");
		}
		Specification<Book> spec = BookSpecs.catalogPublic().and(BookSpecs.inCategory(categoryId));
		return bookRepository.findAll(spec, pageable).map(this::toListItem);
	}

	private UUID resolveAuthorId(Jwt jwt, UUID adminAuthorOverride) {
		if (CatalogAccess.isAdmin(jwt) && adminAuthorOverride != null) {
			return adminAuthorOverride;
		}
		return CatalogAccess.userId(jwt);
	}

	private boolean canRead(Book b, Jwt jwt) {
		if (CatalogAccess.isAdmin(jwt)) {
			return true;
		}
		if (!b.isDeleted() && b.getStatus() == BookStatus.PUBLISHED) {
			return true;
		}
		return jwt != null && CatalogAccess.canEditBook(b, jwt);
	}

	private Set<Category> loadCategories(List<UUID> ids) {
		Set<Category> set = new HashSet<>();
		for (UUID id : ids) {
			Category c = categoryRepository.findById(id)
					.orElseThrow(() -> new NotFoundException("Catégorie introuvable : " + id));
			set.add(c);
		}
		return set;
	}

	private BookListItemResponse toListItem(Book b) {
		return new BookListItemResponse(
				b.getId(),
				b.getTitle(),
				b.getIsbn(),
				b.getAuthorUserId(),
				b.getPrice(),
				b.getLanguage(),
				b.getFormat(),
				b.getStatus(),
				b.getCoverUrl(),
				b.getAverageRating(),
				b.getReviewCount(),
				b.getViewCount(),
				b.getPublishedAt(),
				b.getCreatedAt());
	}

	private BookDetailResponse toDetail(Book b) {
		List<CategorySummaryResponse> cats = b.getCategories().stream()
				.map(c -> new CategorySummaryResponse(c.getId(), c.getName(), c.getSlug()))
				.toList();
		return new BookDetailResponse(
				b.getId(),
				b.getTitle(),
				b.getIsbn(),
				b.getDescription(),
				b.getPrice(),
				b.getLanguage(),
				b.getFormat(),
				b.getStatus(),
				b.getAuthorUserId(),
				b.getCoverUrl(),
				b.getAverageRating(),
				b.getReviewCount(),
				b.getViewCount(),
				b.isDeleted(),
				b.getPublishedAt(),
				b.getCreatedAt(),
				b.getUpdatedAt(),
				cats);
	}
}
