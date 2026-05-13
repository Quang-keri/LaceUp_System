package org.sport.backend.dto.request.settlement;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayoutConfirmRequest {
    private String transferCode;
    private String note;
}
