package com.intergiciel.author_service.client;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
public class OrderSalesClient {

	private final RestClient orderRestClient;

	public OrderSalesClient(@Qualifier("orderRestClient") RestClient orderRestClient) {
		this.orderRestClient = orderRestClient;
	}

	public SalesAggregateResponse aggregateForBooks(List<UUID> bookIds) {
		if (bookIds == null || bookIds.isEmpty()) {
			return new SalesAggregateResponse(0L, BigDecimal.ZERO);
		}
		try {
			SalesAggregateResponse body = orderRestClient.post()
					.uri("/api/v1/internal/sales/aggregate")
					.body(new SalesAggregateRequest(bookIds))
					.retrieve()
					.body(SalesAggregateResponse.class);
			if (body == null) {
				return new SalesAggregateResponse(0L, BigDecimal.ZERO);
			}
			return body;
		}
		catch (RestClientException ex) {
			throw new OrderUnavailableException("Order-service indisponible pour les ventes.", ex);
		}
	}

	private record SalesAggregateRequest(List<UUID> bookIds) {
	}
}
