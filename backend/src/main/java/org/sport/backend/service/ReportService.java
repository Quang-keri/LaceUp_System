package org.sport.backend.service;

import org.sport.backend.dto.response.report.EndOfDayReportDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface ReportService {

    Map<String, Object> getFullDashboardStatsOwner(String range);

    Map<String, Object> getFullDashboardStatsAdmin(String range);

    List<Map<String, Object>> getDynamicOverviewChartAdmin(int year, Integer month);

    List<Map<String, Object>> getDynamicOverviewChartOwner(int year, Integer month);

    EndOfDayReportDTO getEndOfDayReport(LocalDate reportDate);
}
