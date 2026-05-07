package com.intergiciel.wishlist_service.service;

import com.intergiciel.wishlist_service.client.CartAddPayload;
import com.intergiciel.wishlist_service.domain.WishlistItemEntity;
import com.intergiciel.wishlist_service.repository.WishlistItemRepository;
import com.intergiciel.wishlist_service.web.dto.AddWishlistRequest;
import com.intergiciel.wishlist_service.web.dto.MoveToCartResponse;
import com.intergiciel.wishlist_service.web.dto.WishlistItemResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class WishlistService {

	private final WishlistItemRepository wishlistItemRepository;
	private final RestClient orderRestClient;

	public WishlistService(WishlistItemRepository wishlistItemRepository,
			@Qualifier("orderRestClient") RestClient orderRestClient) {
		this.wishlistItemRepository = wishlistItemRepository;
		this.orderRestClient = orderRestClient;
	}

	@Transactional(readOnly = true)
	public List<WishlistItemResponse> list(UUID userId) {
		return wishlistItemRepository.findByUserIdOrderByAddedAtDesc(userId).stream()
				.map(e -> new WishlistItemResponse(e.getId(), e.getBookId(), e.getAddedAt()))
				.toList();
	}

	@Transactional
	public WishlistItemResponse add(UUID userId, AddWishlistRequest request) {
		if (wishlistItemRepository.findByUserIdAndBookId(userId, request.bookId()).isPresent()) {
			throw new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Déjà en liste.");
		}
		WishlistItemEntity saved = wishlistItemRepository.save(new WishlistItemEntity(userId, request.bookId()));
		return new WishlistItemResponse(saved.getId(), saved.getBookId(), saved.getAddedAt());
	}

	@Transactional
	public void remove(UUID userId, UUID bookId) {
		wishlistItemRepository.deleteByUserIdAndBookId(userId, bookId);
	}

	@Transactional
	public MoveToCartResponse moveAllToCart(UUID userId, String authorizationHeader) {
		List<WishlistItemEntity> items = wishlistItemRepository.findByUserIdOrderByAddedAtDesc(userId);
		List<UUID> added = new ArrayList<>();
		List<String> errors = new ArrayList<>();
		for (WishlistItemEntity item : items) {
			try {
				orderRestClient.post()
						.uri("/api/v1/cart/add")
						.header(HttpHeaders.AUTHORIZATION, authorizationHeader)
						.contentType(MediaType.APPLICATION_JSON)
						.body(new CartAddPayload(item.getBookId(), 1, "EBOOK"))
						.retrieve()
						.toBodilessEntity();
				added.add(item.getBookId());
			}
			catch (RestClientException ex) {
				errors.add(item.getBookId() + ": " + ex.getMessage());
			}
		}
		if (!added.isEmpty()) {
			wishlistItemRepository.deleteByUserIdAndBookIdIn(userId, added);
		}
		return new MoveToCartResponse(added, errors);
	}
}
