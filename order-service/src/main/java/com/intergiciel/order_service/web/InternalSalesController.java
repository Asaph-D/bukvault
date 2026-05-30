package com.intergiciel.order_service.web;

import com.intergiciel.order_service.service.SalesAggregationService;
import com.intergiciel.order_service.web.dto.SalesAggregateRequest;
import com.intergiciel.order_service.web.dto.SalesAggregateResponse;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/internal/sales")
@Hidden
public class InternalSalesController {

	private final SalesAggregationService salesAggregationService;

	public InternalSalesController(SalesAggregationService salesAggregationService) {
		this.salesAggregationService = salesAggregationService;
	}

	@PostMapping("/aggregate")
	public SalesAggregateResponse aggregate(@Valid @RequestBody SalesAggregateRequest request) {
		return salesAggregationService.aggregateForBooks(request.bookIds());
	}
}
