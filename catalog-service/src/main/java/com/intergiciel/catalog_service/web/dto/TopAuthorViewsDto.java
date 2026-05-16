package com.intergiciel.catalog_service.web.dto;

import java.util.UUID;

public record TopAuthorViewsDto(UUID authorUserId, long totalViews) {
}
