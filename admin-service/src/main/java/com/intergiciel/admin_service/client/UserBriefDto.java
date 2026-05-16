package com.intergiciel.admin_service.client;

import java.util.UUID;

public record UserBriefDto(
		UUID id,
		String firstName,
		String lastName
) {
}
