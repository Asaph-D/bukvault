package com.intergiciel.community_service.web.dto;

import java.util.UUID;

public record MemberSnapshot(UUID userId, String email, String displayName, String avatarUrl) {
}
