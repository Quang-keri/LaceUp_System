package org.sport.backend.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.NotificationType;

import java.util.UUID;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
@Table(name = "notifications")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "notification_id")
    UUID notificationId;

    @Column(name = "notification_title", length = 100, nullable = false)
    String notificationTitle;

    @Column(name = "notification_body", length = 500)
    String notificationBody;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    User recipient;

    @Column(name = "type")
    NotificationType type;

    @Column(name = "link")
    String link;

    @Column(name = "is_read")
    boolean isRead;

    @Column(name = "is_deleted")
    boolean isDeleted;
}
