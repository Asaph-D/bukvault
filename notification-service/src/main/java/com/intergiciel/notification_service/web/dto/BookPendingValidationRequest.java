package com.intergiciel.notification_service.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BookPendingValidationRequest(
		@NotNull UUID bookId,
		@NotBlank @Size(max = 300) String bookTitle,
		@NotNull UUID authorUserId,
		@NotBlank @Email String authorEmail,
		@Size(max = 200) String authorDisplayName
) {
}
