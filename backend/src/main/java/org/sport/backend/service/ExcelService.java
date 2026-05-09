package org.sport.backend.service;

import org.sport.backend.dto.response.booking.BookingResponse;

import java.io.IOException;
import java.util.List;

public interface ExcelService {
    byte[] exportBookingsToExcel(List<BookingResponse> bookings) throws IOException;
}
