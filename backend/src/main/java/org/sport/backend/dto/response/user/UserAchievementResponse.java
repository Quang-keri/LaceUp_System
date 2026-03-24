package org.sport.backend.dto.response.user;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievementResponse {
    private UUID id;
    private String achievementCode;
    private String description;
    private LocalDateTime achievedAt;
}