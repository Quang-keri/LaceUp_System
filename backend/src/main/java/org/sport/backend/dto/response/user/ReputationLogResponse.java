package org.sport.backend.dto.response.user;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReputationLogResponse {
    private Long id;
    private Integer pointsChanged;
    private String reason;
    private LocalDateTime createdAt;
}