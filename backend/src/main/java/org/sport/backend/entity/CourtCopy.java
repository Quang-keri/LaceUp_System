package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.CourtCopyStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "court_copy")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@SuperBuilder
public class CourtCopy extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "court_copy_id")
    private UUID courtCopyId;

    @Column(name = "court_code",length = 50,nullable = false,unique = true)
    private String courtCode;

    @Column(name = "court_copy_status")
    @Enumerated(EnumType.STRING)
    private CourtCopyStatus courtCopyStatus;

    @ManyToOne
    @JoinColumn(name = "court_court_id")
    private Court court;

    @OneToMany(mappedBy = "courtCopy", fetch = FetchType.LAZY)
    private List<Slot> slots = new ArrayList<>();
}

