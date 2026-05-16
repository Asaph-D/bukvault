package com.intergiciel.admin_service.client;

import java.util.UUID;

public record TopAuthorViewsDto(UUID authorUserId, long totalViews) {
}
