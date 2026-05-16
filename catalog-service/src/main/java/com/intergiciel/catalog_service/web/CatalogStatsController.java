package com.intergiciel.catalog_service.web;

import com.intergiciel.catalog_service.service.CatalogPlatformStatsService;
import com.intergiciel.catalog_service.web.dto.PlatformCatalogStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/catalog")
@Tag(name = "Catalog stats", description = "Agrégats plateforme (admin)")
public class CatalogStatsController {

	private final CatalogPlatformStatsService catalogPlatformStatsService;

	public CatalogStatsController(CatalogPlatformStatsService catalogPlatformStatsService) {
		this.catalogPlatformStatsService = catalogPlatformStatsService;
	}

	@GetMapping("/stats/platform")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Statistiques catalogue pour la vue d'ensemble admin")
	public PlatformCatalogStatsResponse platform() {
		return catalogPlatformStatsService.stats();
	}
}
