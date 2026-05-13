package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.*;
import org.sport.backend.constant.MemberTier;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.AuthProvider;
import org.sport.backend.constant.RankHelper;

import java.math.BigDecimal;
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
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(name = "gender")
    private String gender;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    private AuthProvider provider;

    @Column(name = "phone_number", length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "is_active")
    private boolean active;

    @OneToMany(mappedBy = "recipient", fetch = FetchType.LAZY)
    private List<Notification> notifications;

    @OneToMany(mappedBy = "user1", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conversation> sentConversations;

    @OneToMany(mappedBy = "user2", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Conversation> receivedConversations;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Payment> payments;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "users_permissions",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private List<Permission> extraPermissions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<UserCategoryRank> categoryRanks;

//    @Builder.Default
//    private BigDecimal fakeMoney = BigDecimal.valueOf(1000000.00);

    @Builder.Default
    @Column(name = "credit_score")
    private Integer creditScore = 100;

    @Builder.Default
    @Column(name = "member_tier", length = 20)
    private MemberTier memberTier = MemberTier.BRONZE;

    @Builder.Default
    @Column(name = "total_matches")
    private Integer totalMatches = 0;

    @Builder.Default
    @Column(name = "total_spent", precision = 19, scale = 2)
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReputationLog> reputationLogs;

}
