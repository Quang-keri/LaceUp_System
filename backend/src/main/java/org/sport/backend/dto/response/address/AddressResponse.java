package org.sport.backend.dto.response.address;

import lombok.*;
import org.sport.backend.dto.response.city.CityResponse;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {

    private String street;
    private String ward;
    private String district;
    private CityResponse city;
}
