package com.intergiciel.order_service.service;

import com.intergiciel.order_service.client.CatalogBookClient;
import com.intergiciel.order_service.client.CatalogBookSnapshot;
import com.intergiciel.order_service.client.CatalogUnavailableException;
import com.intergiciel.order_service.domain.CartLineEntity;
import com.intergiciel.order_service.repository.CartLineRepository;
import com.intergiciel.order_service.web.dto.AddToCartRequest;
import com.intergiciel.order_service.web.dto.CartLineResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CartService {

	private static final String PUBLISHED = "PUBLISHED";

	private final CartLineRepository cartLineRepository;
	private final CatalogBookClient catalogBookClient;

	public CartService(CartLineRepository cartLineRepository, CatalogBookClient catalogBookClient) {
		this.cartLineRepository = cartLineRepository;
		this.catalogBookClient = catalogBookClient;
	}

	@Transactional(readOnly = true)
	public List<CartLineResponse> list(UUID userId) {
		return cartLineRepository.findByUserIdOrderById(userId).stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public CartLineResponse add(UUID userId, AddToCartRequest request) {
		CatalogBookSnapshot book;
		try {
			book = catalogBookClient.fetchBook(request.bookId());
		}
		catch (CatalogUnavailableException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), ex);
		}
		if (book == null || book.price() == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prix du livre introuvable.");
		}
		if (book.status() == null || !PUBLISHED.equalsIgnoreCase(book.status())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le livre n'est pas publié.");
		}
		String fmt = formatOrDefault(request.format());
		var existing = cartLineRepository.findByUserIdAndBookId(userId, request.bookId());
		if (existing.isPresent()) {
			CartLineEntity line = existing.get();
			line.setQuantity(line.getQuantity() + request.quantity());
			line.setUnitPrice(book.price());
			line.setFormat(fmt);
			return toResponse(cartLineRepository.save(line));
		}
		CartLineEntity created = new CartLineEntity(userId, request.bookId(), request.quantity(), book.price(), fmt);
		return toResponse(cartLineRepository.save(created));
	}

	@Transactional
	public void removeLine(UUID userId, Long lineId) {
		CartLineEntity line = cartLineRepository.findById(lineId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ligne panier introuvable."));
		if (!line.getUserId().equals(userId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce panier ne vous appartient pas.");
		}
		cartLineRepository.delete(line);
	}

	private CartLineResponse toResponse(CartLineEntity e) {
		BigDecimal total = e.getUnitPrice().multiply(BigDecimal.valueOf(e.getQuantity()));
		return new CartLineResponse(e.getId(), e.getBookId(), e.getQuantity(), e.getUnitPrice(), e.getFormat(), total);
	}

	private static String formatOrDefault(String format) {
		if (format == null || format.isBlank()) {
			return "EBOOK";
		}
		return format.trim().toUpperCase();
	}
}
