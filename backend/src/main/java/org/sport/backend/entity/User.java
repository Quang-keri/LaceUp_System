package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.sport.backend.base.BaseEntity;
import org.sport.backend.constant.AuthProvider;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    UUID userId;

    @Column(name = "user_name", nullable = false, length = 100)
    String userName;

    @Column(name = "gender")
    String gender;

    @Column(nullable = false, unique = true, length = 100)
    String email;

    @Column(name = "password_hash")
    String passwordHash;

    @Column(name = "google_id", unique = true)
    String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    AuthProvider provider;

    @Column(name = "phone_number", length = 20)
    String phone;

    @Column(name = "date_of_birth")
    LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    Role role;

    @Column(name = "is_active")
    boolean active;

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    List<Notification> notifications;

    @OneToMany(mappedBy = "user1", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Conversation> sentConversations;

    @OneToMany(mappedBy = "user2", cascade = CascadeType.ALL, orphanRemoval = true)
    List<Conversation> receivedConversations;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    List<Payment> payments;


//    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
//    private Review review;

}
