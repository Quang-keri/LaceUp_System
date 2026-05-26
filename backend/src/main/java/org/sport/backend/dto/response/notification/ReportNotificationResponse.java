package org.sport.backend.dto.response.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportNotificationResponse {
    private String type;
    private UUID reportId;
    private UUID matchId;
    private String roomCode;
    private String courtName;
    private String reporterName;
    private String reasonType;
    private String message;
    private LocalDateTime reportedAt;
}
