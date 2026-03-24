package org.sport.backend.constant;

import lombok.Getter;

@Getter
public enum AchievementType {
    FIRST_BLOOD("Thắng trận đầu tiên"),
    ON_FIRE("Thắng 5 trận liên tiếp"),
    UNSTOPPABLE("Thắng 10 trận liên tiếp"),
    VETERAN("Chơi 100 trận");

    private final String description;

    AchievementType(String description) {
        this.description = description;
    }
}