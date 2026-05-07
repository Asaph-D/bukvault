package com.intergiciel.order_service.service;

import com.intergiciel.order_service.domain.OrderStatus;
import com.intergiciel.order_service.repository.OrderLineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.UUID;

@Service
public class PurchaseEntitlementService {

	private static final EnumSet<OrderStatus> OWNING_STATUSES = EnumSet.of(
			OrderStatus.PAID,
			OrderStatus.SHIPPED,
			OrderStatus.DELIVERED);

	private final OrderLineRepository orderLineRepository;

	public PurchaseEntitlementService(OrderLineRepository orderLineRepository) {
		this.orderLineRepository = orderLineRepository;
	}

	@Transactional(readOnly = true)
	public boolean hasPurchasedBook(UUID userId, UUID bookId) {
		return orderLineRepository.existsPaidPurchase(userId, bookId, OWNING_STATUSES);
	}
}
