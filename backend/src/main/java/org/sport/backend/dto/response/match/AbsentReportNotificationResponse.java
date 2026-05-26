package org.sport.backend.dto.response.match;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbsentReportNotificationResponse {

    private UUID matchId;
    private UUID courtId;
    private String courtName;
    private String roomCode;
    private LocalDateTime matchStartTime;
    private LocalDateTime matchEndTime;
    private LocalDateTime reportedAt;
    private List<AbsentUserInfo> absentUsers;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AbsentUserInfo {
        private UUID userId;
        private String userName;
        private String phoneNumber;
        private String email;
    }
}
