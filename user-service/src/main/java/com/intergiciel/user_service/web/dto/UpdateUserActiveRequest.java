package com.intergiciel.user_service.web.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateUserActiveRequest(
		@NotNull Boolean active
) {
}
