package com.intergiciel.catalog_service.repository.spec;

import com.intergiciel.catalog_service.domain.Book;
import com.intergiciel.catalog_service.domain.BookFormat;
import com.intergiciel.catalog_service.domain.BookStatus;
import com.intergiciel.catalog_service.domain.Category;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.UUID;

public final class BookSpecs {

	private BookSpecs() {
	}

	public static Specification<Book> notDeleted() {
		return (root, q, cb) -> cb.isFalse(root.get("deleted"));
	}

	public static Specification<Book> statusIs(BookStatus status) {
		return (root, q, cb) -> status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
	}

	public static Specification<Book> catalogPublic() {
		return notDeleted().and(statusIs(BookStatus.PUBLISHED));
	}

	public static Specification<Book> authorIs(UUID authorUserId) {
		return (root, q, cb) -> authorUserId == null ? cb.conjunction()
				: cb.equal(root.get("authorUserId"), authorUserId);
	}

	public static Specification<Book> formatIs(BookFormat format) {
		return (root, q, cb) -> format == null ? cb.conjunction() : cb.equal(root.get("format"), format);
	}

	public static Specification<Book> languageIs(String language) {
		return (root, q, cb) -> language == null || language.isBlank() ? cb.conjunction()
				: cb.equal(cb.lower(root.get("language")), language.trim().toLowerCase());
	}

	public static Specification<Book> priceBetween(BigDecimal min, BigDecimal max) {
		return (root, q, cb) -> {
			var p = cb.conjunction();
			if (min != null) {
				p = cb.and(p, cb.greaterThanOrEqualTo(root.get("price"), min));
			}
			if (max != null) {
				p = cb.and(p, cb.lessThanOrEqualTo(root.get("price"), max));
			}
			return p;
		};
	}

	public static Specification<Book> minRating(Double minRating) {
		return (root, q, cb) -> minRating == null ? cb.conjunction()
				: cb.greaterThanOrEqualTo(root.get("averageRating"), minRating);
	}

	public static Specification<Book> inCategory(UUID categoryId) {
		return (root, q, cb) -> {
			if (categoryId == null) {
				return cb.conjunction();
			}
			Join<Book, Category> cat = root.join("categories", JoinType.INNER);
			return cb.equal(cat.get("id"), categoryId);
		};
	}

	public static Specification<Book> titleOrIsbnContains(String q) {
		return (root, query, cb) -> {
			if (q == null || q.isBlank()) {
				return cb.conjunction();
			}
			String term = "%" + q.trim().toLowerCase() + "%";
			return cb.or(
					cb.like(cb.lower(root.get("title")), term),
					cb.like(cb.lower(root.get("isbn")), term));
		};
	}
}
