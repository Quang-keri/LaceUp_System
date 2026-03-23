package org.sport.backend.dto.request.slot;

import lombok.*;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExtendRequest {
    private int amount;
    private String unit;
}
