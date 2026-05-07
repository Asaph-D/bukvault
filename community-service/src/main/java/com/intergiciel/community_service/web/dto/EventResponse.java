package com.intergiciel.community_service.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public record EventResponse(
		UUID id,
		String title,
		@JsonProperty("when") String whenLabel,
		String tag,
		Instant startsAt) {
}
