package com.intergiciel.notification_service.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record OrderConfirmationRequest(
		@NotNull UUID userId,
		@NotBlank @Email String recipientEmail,
		@Size(max = 120) String firstName,
		@NotNull Long orderId,
		@NotNull BigDecimal totalAmount,
		@NotBlank @Size(max = 8) String currency,
		@NotBlank @Size(max = 500) String libraryUrl,
		@NotEmpty @Valid List<OrderConfirmationLineItem> lines
) {
	public record OrderConfirmationLineItem(
			@NotNull UUID bookId,
			@NotBlank @Size(max = 300) String bookTitle,
			@NotBlank @Size(max = 500) String readUrl
	) {
	}
}
