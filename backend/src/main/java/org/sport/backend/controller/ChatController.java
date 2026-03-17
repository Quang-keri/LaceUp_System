package org.sport.backend.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sport.backend.base.ApiResponse;
import org.sport.backend.dto.request.chat.MessageRequest;
import org.sport.backend.dto.response.chat.ConversationResponse;
import org.sport.backend.dto.response.chat.MessageResponse;
import org.sport.backend.service.ChatService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chat")
@Tag(name = "15. Chat")
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat")
    public void processMessage(@Payload MessageRequest messageRequest, Principal principal) {
        if (principal == null) {
            throw new RuntimeException("User not authenticated in WebSocket");
        }
        chatService.saveMessage(messageRequest, principal.getName());
    }

    @GetMapping("/conversations/{userId}")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getConversations(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(ApiResponse.<List<ConversationResponse>>builder()
                .result(chatService.getUserConversations(userId))
                .build());
    }

    @GetMapping("/history/{conversationId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getHistory(
            @PathVariable UUID conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {

        return ResponseEntity.ok(ApiResponse.<List<MessageResponse>>builder()
                .result(chatService.getMessagesByConversation(conversationId, principal.getName(), page, size))
                .build());
    }

    @GetMapping("/conversation/{conversationId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(
            @PathVariable UUID conversationId) {
        return ResponseEntity.ok(ApiResponse.<ConversationResponse>builder()
                .result(chatService.getConversationById(conversationId))
                .build());
    }

    @PatchMapping("/conversations/{conversationId}/read")
    public ResponseEntity<ApiResponse<Void>> markConversationAsRead(
            @PathVariable UUID conversationId,
            @RequestParam UUID userId) {

        chatService.markAllMessagesInConversationAsRead(conversationId, userId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Conversation marked as read")
                .build());
    }

    @PostMapping(value = "/send-with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessageWithImage(
            @RequestPart("data") MessageRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            Principal principal) {

        MessageResponse response = chatService.saveMessageWithFile(request, principal.getName(), file);
        return ResponseEntity.ok(ApiResponse.<MessageResponse>builder().result(response).build());
    }

}
