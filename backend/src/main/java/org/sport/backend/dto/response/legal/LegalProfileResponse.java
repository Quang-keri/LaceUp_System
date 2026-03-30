package org.sport.backend.dto.response.legal;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LegalProfileResponse {
    private UUID id;
    private String businessLicenseNumber;
    private String taxId;
    private String legalNote;
    private UUID rentalAreaId;
    private List<String> images;
}
