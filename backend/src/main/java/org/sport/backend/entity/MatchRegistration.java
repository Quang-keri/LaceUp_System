package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "match_registrations", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"match_id", "user_id"})
})
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class MatchRegistration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID registrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id")
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "team_number")
    private Integer teamNumber;

    private LocalDateTime registeredAt;

    @Builder.Default
    @Column(name = "player_count", nullable = false)
    private Integer playerCount = 1;

    @Column(name = "amount_due", precision = 19, scale = 2)
    private BigDecimal amountDue;

    @Builder.Default
    @Column(name = "is_paid")
    private Boolean isPaid = false;

    @Column(name = "is_cancelled")
    @Builder.Default
    private Boolean isCancelled = false;

    @OneToMany(mappedBy = "matchRegistration", fetch = FetchType.LAZY)
    private List<Payment> payments;
}
