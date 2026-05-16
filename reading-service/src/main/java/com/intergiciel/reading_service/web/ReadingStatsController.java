package com.intergiciel.reading_service.web;

import com.intergiciel.reading_service.service.ReadingPlatformStatsService;
import com.intergiciel.reading_service.web.dto.PlatformReadingStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reading/stats")
@Tag(name = "Reading stats", description = "Agrégats plateforme (admin)")
public class ReadingStatsController {

	private final ReadingPlatformStatsService readingPlatformStatsService;

	public ReadingStatsController(ReadingPlatformStatsService readingPlatformStatsService) {
		this.readingPlatformStatsService = readingPlatformStatsService;
	}

	@GetMapping("/platform")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Statistiques lecture pour la vue d'ensemble admin")
	public PlatformReadingStatsResponse platform() {
		return readingPlatformStatsService.stats();
	}
}
