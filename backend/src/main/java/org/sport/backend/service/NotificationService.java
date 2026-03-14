package org.sport.backend.service;

import org.sport.backend.constant.NotificationType;
import org.sport.backend.dto.response.notification.NotificationResponse;
import org.sport.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

public interface NotificationService {

    @Transactional
    void createAndSendNotification(
            User sender, User recipient, NotificationType type, String rawContent);

    Page<NotificationResponse> getMyNotification(int page, int size);
}
