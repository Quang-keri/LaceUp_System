package org.sport.backend.service;

import java.util.Map;

public interface ReportService {

    Map<String, Object> getFullDashboardStats(String range);
}
