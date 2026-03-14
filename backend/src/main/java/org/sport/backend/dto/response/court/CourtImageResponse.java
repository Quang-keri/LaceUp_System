package org.sport.backend.dto.response.court;

import lombok.*;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtImageResponse {

    private UUID courtImageId;

    private String imageUrl;

    private Boolean isCover;

    private Integer sortOrder;

}
