package org.sport.backend.dto.response.notification;

import lombok.Builder;
import lombok.Data;
import org.sport.backend.constant.NotificationType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationResponse {
    private UUID notificationId;
    private String notificationTitle;
    private String notificationBody;
    private NotificationType type;
    private String link;
    private boolean isRead;
    private UUID recipientId;
    private LocalDateTime createdAt;
}

