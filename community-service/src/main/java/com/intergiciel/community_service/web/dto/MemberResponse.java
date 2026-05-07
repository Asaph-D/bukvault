package com.intergiciel.community_service.web.dto;

import java.util.UUID;

public record MemberResponse(
		UUID id,
		String email,
		String displayName,
		String role,
		String bio
) {
}

