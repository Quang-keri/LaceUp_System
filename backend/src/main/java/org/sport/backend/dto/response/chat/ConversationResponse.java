package org.sport.backend.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConversationResponse {
    private UUID conversationId;
    private String conversationTitle;
    private String lastMessage;
    private String lastSenderName;
    private UserChatResponse user1;
    private UserChatResponse user2;
    private LocalDateTime updatedAt;
}
