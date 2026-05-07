package com.intergiciel.author_service.service;

import tools.jackson.databind.JsonNode;
import com.intergiciel.author_service.client.CatalogBrowseClient;
import com.intergiciel.author_service.client.CatalogUnavailableException;
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
import java.util.Collections;
import java.util.UUID;

@Service
public class AuthorService {

	private final AuthorProfileRepository authorProfileRepository;
	private final CatalogBrowseClient catalogBrowseClient;

	public AuthorService(AuthorProfileRepository authorProfileRepository,
			CatalogBrowseClient catalogBrowseClient) {
		this.authorProfileRepository = authorProfileRepository;
		this.catalogBrowseClient = catalogBrowseClient;
	}

	public Page<AuthorPublicProfileResponse> listAuthors(Pageable pageable) {
		return new PageImpl<>(Collections.emptyList(), pageable, 0);
	}

	@Transactional(readOnly = true)
	public AuthorPublicProfileResponse getPublicProfile(UUID authorId) {
		AuthorProfileEntity profile = authorProfileRepository.findById(authorId).orElse(null);
		long bookCount = countBooksSafe(authorId);
		if (profile == null) {
			return new AuthorPublicProfileResponse(authorId, null, null, null, bookCount);
		}
		return new AuthorPublicProfileResponse(
				authorId,
				profile.getPenName(),
				profile.getWebsite(),
				profile.getBio(),
				bookCount);
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
		long published = countBooksSafe(authorId);
		return new AuthorDashboardResponse(published, 0,
				"Brouillons : consulter le catalogue authentifié en tant qu'auteur ; agrégation order-service à brancher.");
	}

	public AuthorStatsResponse stats(UUID authorId) {
		return new AuthorStatsResponse(0L, BigDecimal.ZERO,
				"Statistiques ventes : brancher order-service / agrégations.");
	}

	@Transactional
	public AuthorPublicProfileResponse updateMyProfile(UUID userId, AuthorProfileUpdateRequest request) {
		AuthorProfileEntity p = authorProfileRepository.findById(userId)
				.orElseGet(() -> new AuthorProfileEntity(userId));
		p.setPenName(request.penName());
		p.setWebsite(request.website());
		p.setBio(request.bio());
		AuthorProfileEntity saved = authorProfileRepository.save(p);
		long bookCount = countBooksSafe(userId);
		return new AuthorPublicProfileResponse(
				userId,
				saved.getPenName(),
				saved.getWebsite(),
				saved.getBio(),
				bookCount);
	}

	private long countBooksSafe(UUID authorId) {
		try {
			JsonNode root = catalogBrowseClient.fetchBooksByAuthor(authorId, 0, 1);
			if (root != null && root.has("totalElements")) {
				return root.get("totalElements").asLong(0);
			}
		}
		catch (CatalogUnavailableException ignored) {
			return 0;
		}
		return 0;
	}
}
