package org.sport.backend.entity;

import jakarta.persistence.*;
import org.sport.backend.constant.RoleGroup;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "participants")
public class Participant {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private RoleGroup role;

    private LocalDateTime joinedAt;
}