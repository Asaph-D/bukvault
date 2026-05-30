package com.intergiciel.order_service.service;

import com.intergiciel.order_service.client.CatalogBookClient;
import com.intergiciel.order_service.client.CatalogBookDetail;
import com.intergiciel.order_service.domain.OrderStatus;
import com.intergiciel.order_service.repository.OrderLineRepository;
import com.intergiciel.order_service.repository.PurchasedBookProjection;
import com.intergiciel.order_service.web.dto.PurchasedBookResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class PurchasedLibraryService {

	private static final EnumSet<OrderStatus> OWNING_STATUSES = EnumSet.of(
			OrderStatus.PAID,
			OrderStatus.SHIPPED,
			OrderStatus.DELIVERED);

	private final OrderLineRepository orderLineRepository;
	private final CatalogBookClient catalogBookClient;

	public PurchasedLibraryService(
			OrderLineRepository orderLineRepository,
			CatalogBookClient catalogBookClient) {
		this.orderLineRepository = orderLineRepository;
		this.catalogBookClient = catalogBookClient;
	}

	@Transactional(readOnly = true)
	public List<PurchasedBookResponse> listForUser(UUID userId) {
		return orderLineRepository.findPurchasedBooksByUser(userId, OWNING_STATUSES).stream()
				.map(this::toResponse)
				.toList();
	}

	private PurchasedBookResponse toResponse(PurchasedBookProjection row) {
		CatalogBookDetail detail = catalogBookClient.fetchBookDetail(row.getBookId());
		String title = detail != null && detail.title() != null && !detail.title().isBlank()
				? detail.title()
				: "Livre " + row.getBookId().toString().substring(0, 8);
		String coverUrl = detail != null ? detail.coverUrl() : null;
		return new PurchasedBookResponse(
				row.getBookId(),
				title,
				coverUrl,
				row.getPurchasedAt(),
				row.getOrderId());
	}
}
