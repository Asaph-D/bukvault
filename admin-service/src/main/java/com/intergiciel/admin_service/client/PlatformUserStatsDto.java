package com.intergiciel.admin_service.client;

import java.util.List;

public record PlatformUserStatsDto(
		long totalUsers,
		long newUsersLast30Days,
		long newUsersPrevious30Days,
		List<DailyCountDto> registrationsByDay
) {
}
