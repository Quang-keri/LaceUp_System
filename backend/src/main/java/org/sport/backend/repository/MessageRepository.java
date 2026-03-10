package org.sport.backend.repository;

import org.sport.backend.constant.MessageStatus;
import org.sport.backend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversationConversationIdOrderByCreatedAtAsc(UUID conversationId);

    List<Message> findByConversation_ConversationIdAndRecipient_UserIdAndStatusNot(UUID conversationId, UUID userId, MessageStatus messageStatus);
}
