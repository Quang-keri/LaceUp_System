package org.sport.backend.service;

import org.sport.backend.dto.request.chat.MessageRequest;
import org.sport.backend.dto.response.chat.ConversationResponse;
import org.sport.backend.dto.response.chat.MessageResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface ChatService {
    void saveMessage(MessageRequest request, String currentUserEmail);

    MessageResponse saveMessageWithFile(MessageRequest request, String currentUserEmail, MultipartFile file);

    List<ConversationResponse> getUserConversations();

    List<MessageResponse> getMessagesByConversation(
            UUID conversationId, String currentUser, int page, int size);

    ConversationResponse getConversationById(UUID conversationId);

    void markAllMessagesInConversationAsRead(UUID conversationId);

}
