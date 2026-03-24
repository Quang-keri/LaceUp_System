package org.sport.backend.constant;

public enum MatchStatus {
    OPEN,
    WAITING_DEPOSIT,
    CONFIRMED,
    FULL,
    WAITING_RESULT_APPROVAL, // Chờ đối thủ xác nhận kết quả
    COMPLETED,               // Đã hoàn thành (Đã tính điểm/tiền)
    DISPUTED,                // Tranh chấp (Đối thủ bấm Từ chối)
    CANCELLED
}