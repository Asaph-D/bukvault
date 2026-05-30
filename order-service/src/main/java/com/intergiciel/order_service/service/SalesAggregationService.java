package com.intergiciel.order_service.service;

import com.intergiciel.order_service.domain.OrderStatus;
import com.intergiciel.order_service.repository.OrderLineRepository;
import com.intergiciel.order_service.web.dto.SalesAggregateResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
public class SalesAggregationService {

	private static final EnumSet<OrderStatus> PAID_STATUSES = EnumSet.of(
			OrderStatus.PAID,
			OrderStatus.SHIPPED,
			OrderStatus.DELIVERED);

	private final OrderLineRepository orderLineRepository;

	public SalesAggregationService(OrderLineRepository orderLineRepository) {
		this.orderLineRepository = orderLineRepository;
	}

	@Transactional(readOnly = true)
	public SalesAggregateResponse aggregateForBooks(List<UUID> bookIds) {
		if (bookIds == null || bookIds.isEmpty()) {
			return new SalesAggregateResponse(0L, BigDecimal.ZERO);
		}
		long units = orderLineRepository.sumQuantityForBooks(bookIds, PAID_STATUSES);
		BigDecimal revenue = orderLineRepository.sumRevenueForBooks(bookIds, PAID_STATUSES);
		if (revenue == null) {
			revenue = BigDecimal.ZERO;
		}
		return new SalesAggregateResponse(units, revenue);
	}
}
