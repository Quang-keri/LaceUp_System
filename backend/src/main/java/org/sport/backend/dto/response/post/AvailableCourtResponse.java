package org.sport.backend.dto.response.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableCourtResponse {
    private UUID courtId;
    private String courtName;
}
