package org.sport.backend.constant;

import lombok.Getter;

@Getter
public enum AchievementType {

    FIRST_BLOOD("Đệ nhất máu", "Thắng trận đầu tiên"),
    ON_FIRE("Đang trên đà", "Thắng 5 trận liên tiếp"),
    UNSTOPPABLE("Không thể cản phá", "Thắng 10 trận liên tiếp"),
    VETERAN("Lão tướng", "Chơi đủ 100 trận"),

    CENTURION("Kẻ chinh phục", "Đạt mốc 50 trận thắng"),
    LEGEND("Huyền thoại", "Chơi tổng cộng 500 trận"),

    PERFECT_ATTENDANCE("Đúng giờ là vàng", "Hoàn thành 20 trận đấu liên tiếp mà không hủy lịch hoặc đi muộn"),
    SPORTSMANSHIP("Tinh thần thể thao", "Chơi 10 trận liên tiếp không bị báo cáo (report) xấu");

    private final String title;
    private final String description;

    AchievementType(String title, String description) {
        this.title = title;
        this.description = description;
    }
}