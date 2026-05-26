package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.constant.MatchReportStatus;
import org.sport.backend.dto.base.BaseEntity;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "match_reports")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class MatchReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID reportId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ElementCollection
    @CollectionTable(name = "match_report_reported_users", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "user_id")
    private List<UUID> reportedUserIds;

    @Column(name = "reason_type")
    private String reasonType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "match_report_images", joinColumns = @JoinColumn(name = "report_id"))
    @Column(name = "image_url")
    private List<String> evidenceImages;

    @Enumerated(EnumType.STRING)
    private MatchReportStatus status;
}
