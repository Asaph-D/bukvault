package com.intergiciel.admin_service.web.dto;

public record AdminKpiDto(String label, long value, String delta, boolean up, String severity) {
}
