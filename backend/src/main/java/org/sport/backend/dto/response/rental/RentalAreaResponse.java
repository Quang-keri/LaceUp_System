package org.sport.backend.dto.response.rental;

import lombok.Builder;
import lombok.Getter;
import org.sport.backend.constant.RentalAreaStatus;
import org.sport.backend.constant.VerificationStatus;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.court.CourtResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Court;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class RentalAreaResponse {
    private UUID rentalAreaId;
    private String rentalAreaName;
    private AddressResponse address;
    private String contactName;
    private String contactPhone;
    private RentalAreaStatus status;
    private LocalDateTime deletedAt;
    private CityResponse city;
    private UserResponse owner;
    private List<Court> courts;
    private List<RentalAreaImageResponse> images;
    private LocalTime openTime;
    private LocalTime closeTime;
    private Boolean isActive;
    private VerificationStatus verificationStatus;
    private List<CourtResponse> courtResponses;
}
