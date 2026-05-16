package com.intergiciel.admin_service.web.dto;

import java.util.List;

public record AdminDashboardResponse(
		List<AdminKpiDto> kpis,
		List<Long> readsByDay,
		List<String> readsByDayLabels,
		long totalReads,
		List<AdminCategoryShareDto> categoryShares,
		List<AdminTopAuthorDto> topAuthors,
		List<Long> activityByWeekday,
		List<String> activityWeekdayLabels,
		long pendingModeration,
		long openReports,
		String note
) {
}
