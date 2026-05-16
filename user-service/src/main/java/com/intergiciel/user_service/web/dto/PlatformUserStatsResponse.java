package com.intergiciel.user_service.web.dto;

import java.util.List;

public record PlatformUserStatsResponse(
		long totalUsers,
		long newUsersLast30Days,
		long newUsersPrevious30Days,
		List<DailyCountDto> registrationsByDay
) {
}
