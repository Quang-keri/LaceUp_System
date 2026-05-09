package org.sport.backend.dto.response.legal;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LegalImageResponse {
    private UUID legalImageId;
    private String imageUrl;
}
