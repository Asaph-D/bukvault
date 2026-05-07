package com.intergiciel.admin_service.web.dto;

public record AdminDashboardResponse(
		long pendingModerationEstimate,
		long openReportsEstimate,
		long usersEstimate,
		String note
) {
}
