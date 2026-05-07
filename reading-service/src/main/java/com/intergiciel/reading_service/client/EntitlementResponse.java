package com.intergiciel.reading_service.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EntitlementResponse(boolean allowed) {
}
