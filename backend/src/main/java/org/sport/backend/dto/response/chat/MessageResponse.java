package org.sport.backend.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.sport.backend.constant.MessageStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MessageResponse {
    private UUID messageId;
    private UUID conversationId;
    private String content;
    private String senderName;
    private UUID senderId;
    private LocalDateTime createdAt;
    private MessageStatus status;
    private LocalDateTime readAt;
    private String imageUrl;
}
