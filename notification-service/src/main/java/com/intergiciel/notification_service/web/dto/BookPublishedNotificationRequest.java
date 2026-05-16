package com.intergiciel.notification_service.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record BookPublishedNotificationRequest(
		@NotNull UUID authorUserId,
		@NotNull UUID bookId,
		@NotBlank @Size(max = 300) String bookTitle,
		@NotBlank @Email String recipientEmail
) {
}
