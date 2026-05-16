package com.intergiciel.admin_service.client;

import java.util.List;

public record PlatformReadingStatsDto(
		List<DailyCountDto> readsByDay,
		List<DailyCountDto> activityByWeekday
) {
}
