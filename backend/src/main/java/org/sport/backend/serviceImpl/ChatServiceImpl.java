package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.constant.MessageStatus;
import org.sport.backend.constant.NotificationType;
import org.sport.backend.dto.request.chat.MessageRequest;
import org.sport.backend.dto.response.chat.ConversationResponse;
import org.sport.backend.dto.response.chat.MessageResponse;
import org.sport.backend.dto.response.chat.ReadReceiptResponse;
import org.sport.backend.entity.Conversation;
import org.sport.backend.entity.Message;
import org.sport.backend.entity.User;
import org.sport.backend.exception.ResourceNotFoundException;
import org.sport.backend.mapper.ChatMapper;
import org.sport.backend.repository.ConversationRepository;
import org.sport.backend.repository.MessageRepository;
import org.sport.backend.service.ChatService;
import org.sport.backend.service.NotificationService;
import org.sport.backend.service.UploadService;
import org.sport.backend.service.UserService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final SimpMessagingTemplate messagingTemplate;

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    private final ChatMapper chatMapper;

    private final UserService userService;
    private final UploadService uploadService;
    private final NotificationService notificationService;

    @Transactional
    @Override
    public void saveMessage(MessageRequest request, String currentUser) {
        User sender = userService.findByEmail(currentUser);
        createAndBroadcastMessage(sender, request, null);
    }

    @Transactional
    @Override
    public MessageResponse saveMessageWithFile(MessageRequest request, String currentUser, MultipartFile file) {
        User sender = userService.findByEmail(currentUser);
        String imageUrl = null;

        if (file != null && !file.isEmpty()) {
            imageUrl = uploadFile(file);
        }

        return createAndBroadcastMessage(sender, request, imageUrl);
    }

    @Override
    public List<ConversationResponse> getUserConversations() {
        UUID userId = userService.getCurrentUserEntity().getUserId();
        return conversationRepository
                .findAllByUser1UserIdOrUser2UserIdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(chatMapper::toConversationResponse)
                .toList();
    }

    @Override
    public List<MessageResponse> getMessagesByConversation(
            UUID conversationId, String currentUser, int page, int size) {

        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng chat không tồn tại"));

        if (!conv.getUser1().getEmail().equals(currentUser) &&
                !conv.getUser2().getEmail().equals(currentUser)) {
            throw new AccessDeniedException("Bạn không có quyền xem cuộc hội thoại này");
        }

        Pageable pageable = PageRequest.of(page, size);
        return messageRepository.findByConversation_ConversationIdOrderByCreatedAtDesc(conversationId, pageable)
                .getContent()
                .stream()
                .map(chatMapper::toMessageResponse)
                .toList();
    }

    @Override
    public ConversationResponse getConversationById(UUID conversationId) {
        Conversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Phòng chat không tồn tại")); // Nên dùng ResourceNotFoundException thay vì RuntimeException

        UUID currentUserId = userService.getCurrentUserEntity().getUserId();
        if (!conv.getUser1().getUserId().equals(currentUserId) &&
                !conv.getUser2().getUserId().equals(currentUserId)) {
            throw new AccessDeniedException("Bạn không có quyền truy cập cuộc hội thoại này");
        }

        return chatMapper.toConversationResponse(conv);
    }

    @Transactional
    @Override
    public void markAllMessagesInConversationAsRead(UUID conversationId) {

        UUID userId = userService.getCurrentUserEntity().getUserId();

        List<Message> unreadMessages = messageRepository
                .findByConversation_ConversationIdAndRecipient_UserIdAndStatusNot(
                        conversationId, userId, MessageStatus.READ);

        if (unreadMessages.isEmpty()) return;

        unreadMessages.forEach(msg -> {
            msg.setStatus(MessageStatus.READ);
            msg.setReadAt(LocalDateTime.now());
        });
        messageRepository.saveAll(unreadMessages);

        String originalSenderEmail = unreadMessages.getFirst().getSender().getEmail();
        messagingTemplate.convertAndSendToUser(
                originalSenderEmail,
                "/queue/read-receipt",
                new ReadReceiptResponse(conversationId, userId)
        );
    }

    private MessageResponse createAndBroadcastMessage(User sender, MessageRequest request, String imageUrl) {
        if (sender.getUserId().equals(request.getRecipientId())) {
            throw new IllegalArgumentException("Cannot send message to yourself");
        }

        User recipient = userService.findByUserId(request.getRecipientId());
        Conversation conversation = getOrCreateConversation(sender, recipient);

        Message newMessage = Message.builder()
                .messageBody(request.getContent())
                .imageUrl(imageUrl)
                .sender(sender)
                .recipient(recipient)
                .conversation(conversation)
                .status(MessageStatus.SENT)
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(newMessage);

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        MessageResponse response = chatMapper.toMessageResponse(saved);

        broadcastMessage(response, sender.getEmail(), recipient.getEmail());

        notificationService.createAndSendNotification(sender, recipient, NotificationType.CHAT, response.getContent());

        return response;
    }

    private String uploadFile(MultipartFile file) {
        try {
            Map<?, ?> uploadResult = uploadService.uploadImage(file);
            return uploadResult.get("secure_url").toString();
        } catch (IOException e) {
            log.error("Failed to upload image", e);
            throw new RuntimeException("Image upload failed");
        }
    }

    private Conversation getOrCreateConversation(User sender, User recipient) {
        Conversation conversation = conversationRepository
                .findBetweenUsers(sender.getUserId(), recipient.getUserId())
                .orElseGet(() -> {
                    boolean senderIsUser1 = sender.getUserId().compareTo(recipient.getUserId()) < 0;
                    return Conversation.builder()
                            .user1(senderIsUser1 ? sender : recipient)
                            .user2(senderIsUser1 ? recipient : sender)
                            .createdAt(LocalDateTime.now())
                            .build();
                });

        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    private void broadcastMessage(MessageResponse response, String senderEmail, String recipientEmail) {

        messagingTemplate.convertAndSendToUser(
                recipientEmail,
                "/queue/messages",
                response
        );

        messagingTemplate.convertAndSendToUser(
                senderEmail,
                "/queue/messages",
                response
        );
    }
}
