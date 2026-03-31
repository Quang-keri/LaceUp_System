package org.sport.backend.service;

import java.util.Map;

public interface ReportService {

    Map<String, Object> getFullDashboardStatsOwner(String range);

    Map<String, Object> getFullDashboardStatsAdmin(String range);
}
