package org.sport.backend.dto.request.legal;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Data
public class LegalProfileRequest {
    private UUID rentalAreaId;
    private String businessLicenseNumber;
    private String taxId;
    private String legalNote;
    private List<MultipartFile> imageFiles;
}
