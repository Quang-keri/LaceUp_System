package org.sport.backend.dto.response.chat;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class ReadReceiptResponse {
    private UUID conversationId;
    private UUID readerId;
}