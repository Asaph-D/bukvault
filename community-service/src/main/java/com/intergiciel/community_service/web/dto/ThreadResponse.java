package com.intergiciel.community_service.web.dto;

import java.util.UUID;

public record ThreadResponse(UUID id, String title, String channel, int users, boolean hot, String last) {
}
