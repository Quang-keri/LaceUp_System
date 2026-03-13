package org.sport.backend.dto.response.rental;

import lombok.*;
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

    UUID rentalAreaId;
    String rentalAreaName;
    String address;
    String contactName;
    String contactPhone;

    CityResponse city;

    List<RentalAreaImageResponse> images;

    List<CourtSummaryResponse> courts;

}
