package org.sport.backend.dto.response.slot;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckAvailabilityResponse {
    private boolean isAvailable;
    private String message;
    private int availableCourts;

    public CheckAvailabilityResponse(boolean isAvailable, String message) {
        this.isAvailable = isAvailable;
        this.message = message;
        this.availableCourts = 0;
    }
}