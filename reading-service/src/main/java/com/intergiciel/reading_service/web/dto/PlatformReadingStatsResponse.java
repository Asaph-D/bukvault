package com.intergiciel.reading_service.web.dto;

import java.util.List;

public record PlatformReadingStatsResponse(
		List<DailyCountDto> readsByDay,
		List<DailyCountDto> activityByWeekday
) {
}
