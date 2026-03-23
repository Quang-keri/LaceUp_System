package org.sport.backend.service;

import org.sport.backend.dto.response.booking.BookingResponse;

public interface InvoiceService {

    byte[] generateInvoicePdf(BookingResponse booking);
}
