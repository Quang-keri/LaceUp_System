package org.sport.backend.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.sport.backend.dto.response.notification.NotificationResponse;
import org.sport.backend.entity.Notification;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(source = "recipient.userId", target = "recipientId")
    @Mapping(source = "createdAt", target = "createdAt")
    NotificationResponse toResponse(Notification notification);

    List<NotificationResponse> toResponseList(List<Notification> notifications);
}
