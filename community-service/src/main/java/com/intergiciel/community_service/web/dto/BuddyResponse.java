package com.intergiciel.community_service.web.dto;

import java.util.UUID;

public record BuddyResponse(UUID id, String name, String reading, int match) {
}
