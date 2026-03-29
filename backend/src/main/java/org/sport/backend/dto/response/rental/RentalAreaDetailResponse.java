package org.sport.backend.dto.response.rental;

import lombok.*;
import org.sport.backend.dto.response.address.AddressResponse;
import org.sport.backend.dto.response.city.CityResponse;
import org.sport.backend.dto.response.court.CourtSummaryResponse;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RentalAreaDetailResponse {

    private UUID rentalAreaId;
    private String rentalAreaName;
    private AddressResponse address;
    private String contactName;
    private String contactPhone;
    private UUID ownerId;
    private CityResponse city;
    private List<RentalAreaImageResponse> images;

    private List<CourtSummaryResponse> courts;

}
