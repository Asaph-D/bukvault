package com.intergiciel.user_service.web.dto;

import com.intergiciel.user_service.domain.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
		@NotNull Role role
) {
}
