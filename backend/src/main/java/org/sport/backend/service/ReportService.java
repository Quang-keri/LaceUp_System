package org.sport.backend.service;

import org.sport.backend.constant.BookingStatus;

import java.util.Map;

public interface ReportService {
    Map<BookingStatus, Long> getDashboardStats();
}
