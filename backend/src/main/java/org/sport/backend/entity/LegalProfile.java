package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;

import java.util.UUID;


@Entity
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Table(name = "legal_profiles")
public class LegalProfile extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "business_license_number")
    private String businessLicenseNumber;

    @Column(name = "tax_id")
    private String taxId;

    @Column(name = "legal_note", columnDefinition = "TEXT")
    private String legalNote;

    // Ảnh giấy phép (có thể lưu dạng JSON chuỗi hoặc tạo Entity LegalImage riêng)
    // OneToOne với RentalArea hoặc ManyToOne với User (Owner)
}