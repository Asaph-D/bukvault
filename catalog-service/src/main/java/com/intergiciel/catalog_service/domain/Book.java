package com.intergiciel.catalog_service.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "catalog_books", uniqueConstraints = @UniqueConstraint(columnNames = "isbn"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 32)
	private String isbn;

	@Column(nullable = false, length = 500)
	private String title;

	@Column(length = 12000)
	private String description;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Column(nullable = false, length = 32)
	private String language;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private BookFormat format;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private BookStatus status;

	@Column(name = "author_user_id", nullable = false)
	private UUID authorUserId;

	@Column(name = "cover_url", length = 2000)
	private String coverUrl;

	@Column(name = "view_count", nullable = false)
	private long viewCount;

	@Column(name = "average_rating", nullable = false)
	private double averageRating;

	@Column(name = "review_count", nullable = false)
	private int reviewCount;

	@Column(nullable = false)
	private boolean deleted;

	@Column(name = "published_at")
	private Instant publishedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(
			name = "catalog_book_categories",
			joinColumns = @JoinColumn(name = "book_id"),
			inverseJoinColumns = @JoinColumn(name = "category_id"))
	@Builder.Default
	private Set<Category> categories = new HashSet<>();
}
