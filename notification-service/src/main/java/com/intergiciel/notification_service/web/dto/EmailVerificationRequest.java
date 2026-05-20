package com.intergiciel.notification_service.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailVerificationRequest(
		@NotBlank @Email @Size(max = 320) String recipientEmail,
		@Size(max = 120) String firstName,
		@NotBlank @Size(max = 2048) String verifyUrl
) {
}
