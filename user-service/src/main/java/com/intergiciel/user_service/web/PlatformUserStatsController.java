package com.intergiciel.user_service.web;

import com.intergiciel.user_service.service.PlatformUserStatsService;
import com.intergiciel.user_service.web.dto.PlatformUserStatsResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users/stats")
@Tag(name = "User stats", description = "Agrégats plateforme (admin)")
public class PlatformUserStatsController {

	private final PlatformUserStatsService platformUserStatsService;

	public PlatformUserStatsController(PlatformUserStatsService platformUserStatsService) {
		this.platformUserStatsService = platformUserStatsService;
	}

	@GetMapping("/platform")
	@PreAuthorize("hasRole('ADMIN')")
	@Operation(summary = "Statistiques utilisateurs pour la vue d'ensemble admin")
	public PlatformUserStatsResponse platform() {
		return platformUserStatsService.stats();
	}
}
