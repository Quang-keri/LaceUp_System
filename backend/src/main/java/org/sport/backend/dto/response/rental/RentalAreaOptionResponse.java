package org.sport.backend.dto.response.rental;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class RentalAreaOptionResponse {
    private UUID rentalAreaId;
    private String rentalAreaName;
    private String addressText;
}
