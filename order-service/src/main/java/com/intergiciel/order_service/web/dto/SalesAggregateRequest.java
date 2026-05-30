package com.intergiciel.order_service.web.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SalesAggregateRequest(
		@NotNull List<UUID> bookIds
) {
}
