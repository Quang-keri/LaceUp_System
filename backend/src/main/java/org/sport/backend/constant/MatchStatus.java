package org.sport.backend.constant;

public enum MatchStatus {
    OPEN,                    // Phòng đang mở, chờ người chơi tham gia
    READY,                   // Phòng đã đủ người, sẵn sàng thi đấu (Thay cho WAITING_DEPOSIT/CONFIRMED)
    PLAYING,                 // Trận đấu đang diễn ra trên sân
    WAITING_RESULT_APPROVAL, // Trận đấu kết thúc, chờ đối thủ xác nhận kết quả tỉ số
    COMPLETED,               // Đã hoàn thành (Đối thủ đồng ý kết quả, tiến hành cộng/trừ điểm rank)
    DISPUTED,                // Tranh chấp (Đối thủ bấm từ chối kết quả đã báo cáo)
    CANCELLED                // Trận đấu bị hủy (Do chủ phòng hủy hoặc hệ thống tự động hủy)
}