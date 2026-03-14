package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.sport.backend.dto.response.chat.ConversationResponse;
import org.sport.backend.dto.response.chat.MessageResponse;
import org.sport.backend.entity.Conversation;
import org.sport.backend.entity.Message;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    @Mapping(target = "user1", source = "user1")
    @Mapping(target = "user2", source = "user2")
    ConversationResponse toConversationResponse(Conversation conversation);

    @Mapping(target = "messageId", source = "messageId")
    @Mapping(target = "senderId", source = "sender.userId")
    @Mapping(target = "senderName", source = "sender.userName")
    @Mapping(target = "content", source = "messageBody")
    @Mapping(target = "conversationId", source = "conversation.conversationId")
    @Mapping(target = "imageUrl", source = "imageUrl")
    MessageResponse toMessageResponse(Message message);
}
