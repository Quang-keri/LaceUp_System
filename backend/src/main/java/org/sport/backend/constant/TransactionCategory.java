package org.sport.backend.constant;

public enum TransactionCategory {
    BOOKING_DEPOSIT,     // tiền cọc booking
    BOOKING_FULL_PAYMENT,
    BOOKING_REMAINING_PAYMENT,
    EXTRA_SERVICE_PAYMENT,
    OWNER_PAYOUT,        // tiền trả owner
    ADMIN_COMMISSION,    // tiền hoa hồng admin
    REFUND,
    OTHER
}
