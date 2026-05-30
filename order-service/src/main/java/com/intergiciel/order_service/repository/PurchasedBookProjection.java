package com.intergiciel.order_service.repository;

import java.time.Instant;
import java.util.UUID;

public interface PurchasedBookProjection {

	UUID getBookId();

	Instant getPurchasedAt();

	Long getOrderId();
}
