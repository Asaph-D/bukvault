package com.intergiciel.author_service.service;

import tools.jackson.databind.JsonNode;
import com.intergiciel.author_service.client.CatalogBrowseClient;
import com.intergiciel.author_service.client.CatalogUnavailableException;
import com.intergiciel.author_service.client.OrderSalesClient;
import com.intergiciel.author_service.client.OrderUnavailableException;
import com.intergiciel.author_service.client.SalesAggregateResponse;
import com.intergiciel.author_service.domain.AuthorProfileEntity;
import com.intergiciel.author_service.repository.AuthorProfileRepository;
import com.intergiciel.author_service.web.dto.AuthorDashboardResponse;
import com.intergiciel.author_service.web.dto.AuthorProfileUpdateRequest;
import com.intergiciel.author_service.web.dto.AuthorPublicProfileResponse;
import com.intergiciel.author_service.web.dto.AuthorStatsResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class AuthorService {

	private static final int CATALOG_PAGE_SIZE = 100;

	private final AuthorProfileRepository authorProfileRepository;
	private final CatalogBrowseClient catalogBrowseClient;
	private final OrderSalesClient orderSalesClient;

	public AuthorService(AuthorProfileRepository authorProfileRepository,
			CatalogBrowseClient catalogBrowseClient,
			OrderSalesClient orderSalesClient) {
		this.authorProfileRepository = authorProfileRepository;
		this.catalogBrowseClient = catalogBrowseClient;
		this.orderSalesClient = orderSalesClient;
	}

	public Page<AuthorPublicProfileResponse> listAuthors(Pageable pageable) {
		return new PageImpl<>(Collections.emptyList(), pageable, 0);
	}

	@Transactional(readOnly = true)
	public AuthorPublicProfileResponse getPublicProfile(UUID authorId) {
		AuthorProfileEntity profile = authorProfileRepository.findById(authorId).orElse(null);
		AuthorCatalogSnapshot snapshot = loadCatalogSnapshotSafe(authorId);
		if (profile == null) {
			return new AuthorPublicProfileResponse(authorId, null, null, null, snapshot.totalBooks());
		}
		return new AuthorPublicProfileResponse(
				authorId,
				profile.getPenName(),
				profile.getWebsite(),
				profile.getBio(),
				snapshot.totalBooks());
	}

	public JsonNode getBooksForAuthor(UUID authorId, int page, int size) {
		try {
			return catalogBrowseClient.fetchBooksByAuthor(authorId, page, size);
		}
		catch (CatalogUnavailableException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), ex);
		}
	}

	public AuthorDashboardResponse dashboard(UUID authorId) {
		AuthorCatalogSnapshot snapshot = loadCatalogSnapshotSafe(authorId);
		String hint = snapshot.catalogUnavailable()
				? "Catalogue indisponible — compteurs partiels."
				: snapshot.published() + " publié(s), "
						+ snapshot.draft() + " brouillon(s), "
						+ snapshot.rejected() + " refusé(s) — source catalog-service.";
		return new AuthorDashboardResponse(snapshot.published(), snapshot.draft() + snapshot.rejected(), hint);
	}

	public AuthorStatsResponse stats(UUID authorId) {
		AuthorCatalogSnapshot snapshot = loadCatalogSnapshotSafe(authorId);
		if (snapshot.bookIds().isEmpty()) {
			return new AuthorStatsResponse(0L, BigDecimal.ZERO,
					snapshot.catalogUnavailable()
							? "Catalogue indisponible — aucune vente agrégée."
							: "Aucun titre — ventes à 0.");
		}
		try {
			SalesAggregateResponse sales = orderSalesClient.aggregateForBooks(snapshot.bookIds());
			String note = "Ventes agrégées depuis order-service (commandes PAID/SHIPPED/DELIVERED).";
			if (snapshot.catalogUnavailable()) {
				note = note + " Catalogue partiellement indisponible.";
			}
			return new AuthorStatsResponse(sales.totalUnitsSold(), sales.revenue(), note);
		}
		catch (OrderUnavailableException ex) {
			return new AuthorStatsResponse(0L, BigDecimal.ZERO,
					"Order-service indisponible — ventes non calculées.");
		}
	}

	@Transactional
	public AuthorPublicProfileResponse updateMyProfile(UUID userId, AuthorProfileUpdateRequest request) {
		AuthorProfileEntity p = authorProfileRepository.findById(userId)
				.orElseGet(() -> new AuthorProfileEntity(userId));
		p.setPenName(request.penName());
		p.setWebsite(request.website());
		p.setBio(request.bio());
		AuthorProfileEntity saved = authorProfileRepository.save(p);
		long bookCount = loadCatalogSnapshotSafe(userId).totalBooks();
		return new AuthorPublicProfileResponse(
				userId,
				saved.getPenName(),
				saved.getWebsite(),
				saved.getBio(),
				bookCount);
	}

	private AuthorCatalogSnapshot loadCatalogSnapshotSafe(UUID authorId) {
		try {
			return loadCatalogSnapshot(authorId);
		}
		catch (CatalogUnavailableException ex) {
			return AuthorCatalogSnapshot.unavailable();
		}
	}

	private AuthorCatalogSnapshot loadCatalogSnapshot(UUID authorId) {
		long published = 0;
		long draft = 0;
		long rejected = 0;
		List<UUID> bookIds = new ArrayList<>();
		int page = 0;
		int totalPages = 1;

		while (page < totalPages) {
			JsonNode root = catalogBrowseClient.fetchBooksByAuthor(authorId, page, CATALOG_PAGE_SIZE);
			if (root == null) {
				break;
			}
			totalPages = Math.max(1, root.path("totalPages").asInt(1));
			JsonNode content = root.path("content");
			if (!content.isArray()) {
				break;
			}
			for (JsonNode book : content) {
				String idText = book.path("id").asString(null);
				if (idText == null || idText.isBlank()) {
					continue;
				}
				bookIds.add(UUID.fromString(idText));
				switch (book.path("status").asString("").toUpperCase()) {
					case "PUBLISHED" -> published++;
					case "REJECTED" -> rejected++;
					default -> draft++;
				}
			}
			page++;
		}

		return new AuthorCatalogSnapshot(published, draft, rejected, bookIds, false);
	}

	private record AuthorCatalogSnapshot(
			long published,
			long draft,
			long rejected,
			List<UUID> bookIds,
			boolean catalogUnavailable) {

		static AuthorCatalogSnapshot unavailable() {
			return new AuthorCatalogSnapshot(0, 0, 0, List.of(), true);
		}

		long totalBooks() {
			return published + draft + rejected;
		}
	}
}
